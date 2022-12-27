import { HttpService } from '@nestjs/axios';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DBName, BaseFullService, JwtPayload } from '@proguidemc/http-module';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { OrdenTransporteService } from '../ordentransporte/ordentransporte.service';
import { Pallet, PalletCount, PalletVM, ProductoPallet, ProductoPalletRequest } from './model/pallet.model';
import { ProductService } from '../producto/producto.service';
import { Product } from '../producto/model/producto.model';
import { PalletEstadoService } from './palletestado.service';
import { OrdenTransporteVM } from '../ordentransporte/model/ordentransporte.model';
import { EstadoPalletEnum } from './model/palletestado.model';
import { OrdenTransporteEstadoEnum } from '../ordentransporte/model/ordentransporteestado.model';
import { applyFilterWitthPermission, ArrayList, ElementName, errorFn, formatDate, hasCustomPermission, padLeadingZeros, parseNumber, toArray, toString } from '../shared/utils/utils';
import { PrinterDataItem, PrinterService } from '../shared/printer/printer.service';
import { PlanillaArmado, Usuario } from '../planillaarmado/model/plantilla.model';
import { PlanillaService } from '../planillaarmado/planilla.service';
import { PlanillaArmadoEstadoEnum } from '../planillaarmado/model/planillaestado.model';
import { LugarVM } from '../shared/lugar/model/lugar.model';

@Injectable()
export class PalletService extends BaseFullService<Pallet> {
    constructor(
        @Inject(forwardRef(() => OrdenTransporteService)) public ordenTransporteService: OrdenTransporteService,
        @Inject(forwardRef(() => PlanillaService)) public planillaArmadoService: PlanillaService,
        public productService: ProductService,
        protected httpService: HttpService,
        public userConfigService: UserConfigService,
        private palletEstadoService: PalletEstadoService,
        private printerService: PrinterService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'pallet'}, httpService);
    }
    
    getOTCloseEnabled(ordenIds: string[]): Promise<CloseEnabledItem[]> {
        return new Promise(async resolve => {
            const resp: CloseEnabledItem[] = [];
            ordenIds.forEach(item => {
                if (!resp.some(i => i.idorden == item)) {
                    resp.push({
                        idorden: item,
                        closeEnabled: true,
                    });
                }
            });
            
            const items = await this.findAll({
                estado: {$in: [
                    EstadoPalletEnum.Generado,
                    EstadoPalletEnum.Asignado,
                    EstadoPalletEnum.Despachado,
                    EstadoPalletEnum.Liberado
                ]}
            });
                        
            for (const item of items) {
                const ordenesPallet = toArray(item?.productos).map(i => i.ordentransporteid);
                for (const orden of ordenesPallet) {
                    const index = resp.findIndex(i => i.idorden == orden);
                    if (index >= 0) {
                        resp[index].closeEnabled = false;
                    }    
                }
            }
            
            resolve(resp);
        });
    }

    getAll(user: JwtPayload, pallets: Pallet[], misOrigenes: string[]) {
        return this.normalize(user, pallets, misOrigenes, false);
    }

    private permissionOk(user: JwtPayload, elementName: ElementName): boolean {
        return hasCustomPermission(user, 'gestion de pallets', elementName);
    }

    async get(user: JwtPayload, onlyUnassigned: boolean, id?: string, includestock?: boolean, onlyCount?: boolean): Promise<PalletCount | PalletVM | PalletVM[]> {
        return new Promise(async (resolve, reject) => {
            const userInfo = await this.userConfigService.get(user.userId);
            if (userInfo.origenesid.length == 0) {
                return reject({message: 'El usuario no posee origen.'});
            }
            
            const filter: any = {};

            const includeAll = this.permissionOk(user, 'include-all');
            const includeTargets = this.permissionOk(user, 'include-target');

            applyFilterWitthPermission(filter, includeAll, includeTargets, userInfo.origenesid);
            
            if (onlyUnassigned) filter.estado = {"$in": [EstadoPalletEnum.Generado, EstadoPalletEnum.Liberado]};

            if (id) {
                filter._id = id;
            }

            if (onlyCount) {
                const count = await this.count(filter);
                return resolve({count});
            }

            const resp = await this.normalize(user, await this.findAll(filter), userInfo.origenesid, includestock);
            if (id) {
                if (resp.length == 0) return reject({message: 'No se encontro el pallet'});
                return resolve(resp[0]);
            }

            resolve(resp);
        });
    }

    insert(user: JwtPayload, pallets: ProductoPallet[], chep: boolean, origenid: string): Promise<Pallet | undefined> {
        return new Promise(async (resolve, reject) => {
            
            if(!Array.isArray(pallets) || pallets.length === 0) return reject({messaje: 'Debe incluir pallets.'});
            
            const oe = await this.ordenTransporteService.findById(pallets[0].ordentransporteid);
            if (!oe?.destinoid) return reject({messaje: 'No se encontró destino de pallet.'}); 

            return resolve(await this.create({
                    productos: pallets.map((item) => ({
                        cantidad: item.cantidad,
                        ordentransporteid: item.ordentransporteid,
                        productoid: item.productoid,
                    })),
                    origenid,
                    destinoid: oe.destinoid,
                    chep,
                    estado: EstadoPalletEnum.Generado,
                    usuario: user.username
                })
            )
        })
    }

    private async normalize(user: JwtPayload, pallets: Pallet[], misOrigenes: string[], includestock?: boolean): Promise<PalletVM[]> {
        if (pallets.length == 0) return [];

        const estados = await this.palletEstadoService.findAll({});
        
        const productoIds = new ArrayList();
        const ordenIds = new ArrayList();
        const productos: Product[] = [];
        const ordenes: OrdenTransporteVM[] = [];
        const entityIds = new ArrayList();
        const entities: LugarVM[] = [];
        const usuarioIds = new ArrayList();
        const usuarios: Usuario[] = [];
        
        pallets.forEach(item => {
            item.productos.forEach(i => {
                productoIds.push(i.productoid);
                ordenIds.push(i.ordentransporteid);
            });
            entityIds.push(item.origenid);
            entityIds.push(item.destinoid);
            usuarioIds.push(item.usuario);
        });

        const getInfoProducts = (): Promise<Product[]> => {
            const origen = includestock && pallets.length == 1 && [EstadoPalletEnum.Generado, EstadoPalletEnum.Liberado].includes(pallets[0].estado) ? 
                            pallets[0].origenid : 
                            null;
            if (origen) {
                return new Promise(async resolve => {
                    const productosm = await this.productService.findAll({_id: {$in: productoIds.get()}});
                    
                    const stock = await this.productService.getStockConsulta(user, productosm.map(i => {
                        return {deposito: origen, producto: toString(i.codigosap)}
                    }));
                    
                    productosm.forEach(i => {
                        const producto = stock.find(s => s?.input?.producto == i.codigosap);
                        i.stock = parseNumber(producto?.available, -1).toString();
                    });

                    resolve(productosm);
                });
            }
            return this.productService.findAll({_id: {$in: productoIds.get()}});
        }

        await Promise.all([
            getInfoProducts(),
            this.ordenTransporteService.getCustomAll(user, {_id: {$in: ordenIds.get()}}, true),
            this.userConfigService.getInfoEntities(entityIds.get()),
            this.userConfigService.findUsers({username: {$in: usuarioIds.get()}})
        ])
        .then(responses => {
            productos.push(...responses[0]);
            ordenes.push(...responses[1]);
            entities.push(...responses[2]);
            usuarios.push(...responses[3])
        })
        .catch(errorFn);

        return pallets.map(pallet => {
            
            return {
                ...pallet,
                origen: entities.find(i => i.id == pallet.origenid),
                destino: entities.find(i => i.id == pallet.destinoid),
                productos: pallet.productos.map(producto => {
                    return {
                        ...producto,
                        ordentransporte: ordenes.find(i => i.id == producto.ordentransporteid),
                        producto: productos.find(p => p.id == producto.productoid)
                    }
                }),    
                estado: estados.find((estado) => estado.id == pallet.estado),
                viewenabled: misOrigenes.length == 0 || misOrigenes.indexOf(pallet.origenid) >= 0,
                usuario: usuarios.find((u) => u.username == pallet.usuario)
            }
        });
    }

    updateProducts(palletId: string, productosActualizar: PalletUpdateBody[]): Promise<Pallet | undefined> {
        return new Promise(async (resolve, reject) => {
            if (productosActualizar.length == 0) return reject({message: 'Verifique los parametros enviados.'});

            const pallet = await this.findById(palletId);
            if (pallet?.estado !== EstadoPalletEnum.Liberado && pallet?.estado !== EstadoPalletEnum.Generado) return reject({message: 'No puede modificar un pallet en uso.'});

            const ordenesTransporte = await this.ordenTransporteService.findAll({_id: {"$in": productosActualizar.map((item) => item.ordentransporteid)}});
            if (ordenesTransporte.length == 0) return reject({message: 'Error al obtener ordenes relacionadas.'});
            if (ordenesTransporte.some((item) => item.estado === OrdenTransporteEstadoEnum.Preparacion)) return reject({message: 'No es posible modificar la cantidad de un material cuya Orden de Entrega posee estado EN PREPARACION.'});
            // Array con los datos a actualizar.
            const updates: {
                indexOrder: number,
                indexProductoOrder: number,
                indexProductPallet: number,
                OP: 'add' | 'reduce' | null,
                valueOrder: number,
                valuePallet: number,
                deleted: boolean,
            }[] = [];

            productosActualizar.forEach(newValue => {
                const prodPalletIndex = pallet.productos.findIndex((item) => item.productoid == newValue.productoid && item.ordentransporteid == newValue.ordentransporteid);
                const actualValue = prodPalletIndex < 0 ? -1 : parseNumber(pallet.productos[prodPalletIndex].cantidad);
                
                const orderIndex = ordenesTransporte.findIndex((item) => item.id == newValue.ordentransporteid);
                const prodInOrderIndex = orderIndex < 0 ? -1 : ordenesTransporte[orderIndex].productos.findIndex((item) => item.productoid == newValue.productoid);
                if (prodInOrderIndex >= 0 && prodPalletIndex >= 0) {
                    const update: any = {
                        indexOrder: orderIndex,
                        indexProductoOrder: prodInOrderIndex,
                        indexProductPallet: prodPalletIndex,
                        OP: null,
                        valueOrder: 0,
                        valuePallet: parseNumber(newValue.newCantidad),
                        deleted: newValue?.deleted
                    }

                    if (update.valuePallet == 0 || update.deleted) {
                        update.OP = 'add';
                        update.valueOrder = actualValue;
                    } else if (update.valuePallet < actualValue) {
                        // Obtenemos la cantidad a sumar en la orden.
                        const valueToOrder = (actualValue - update.valuePallet);
                        update.OP = 'add';
                        update.valueOrder = valueToOrder;
                    } else if (update.valuePallet > actualValue) {
                        // Obtenemos la cantidad a restar en la orden.
                        const valueToOrder = (newValue.newCantidad - actualValue);
                        if ((parseNumber(ordenesTransporte[orderIndex].productos[prodInOrderIndex].cantidaddisponible) - valueToOrder) >= 0) {
                            update.OP = 'reduce';
                            update.valueOrder = valueToOrder;
                        }
                    }
                    update.OP && updates.push(update);
                }
            })

            for (const update of updates) {
                // Agregamos la cant a la Orden de tranporte.
                if (update.OP == 'add') {                    
                    ordenesTransporte[update.indexOrder].productos[update.indexProductoOrder].cantidaddisponible = Math.min(
                        ordenesTransporte[update.indexOrder].productos[update.indexProductoOrder].cantidadtotal,
                        (update.valueOrder + parseNumber(ordenesTransporte[update.indexOrder].productos[update.indexProductoOrder].cantidaddisponible))
                    );

                    if (ordenesTransporte[update.indexOrder].estado != OrdenTransporteEstadoEnum.CerradaConPendiente) {
                        const planillasOT: PlanillaArmado[] = await this.planillaArmadoService.findAll({"ordenestransporte.id": ordenesTransporte[update.indexOrder].id, estado: PlanillaArmadoEstadoEnum.Generada});
                        if (ordenesTransporte[update.indexOrder].estado == OrdenTransporteEstadoEnum.Despachada && planillasOT.length > 0) {
                            ordenesTransporte[update.indexOrder].estado = OrdenTransporteEstadoEnum.Preparacion;
                        }
                        if (ordenesTransporte[update.indexOrder].productos.every(p => p.cantidadtotal == p.cantidaddisponible) && planillasOT.length == 0) {
                            ordenesTransporte[update.indexOrder].estado = OrdenTransporteEstadoEnum.Generada;
                        }
                        if (ordenesTransporte[update.indexOrder].productos.some(p => p.cantidaddisponible != 0) && planillasOT.length == 0) {
                            ordenesTransporte[update.indexOrder].estado = OrdenTransporteEstadoEnum.Pendiente;
                        }
                    }                    
                } else if (update.OP == 'reduce') {
                    ordenesTransporte[update.indexOrder].productos[update.indexProductoOrder].cantidaddisponible = Math.min(
                        ordenesTransporte[update.indexOrder].productos[update.indexProductoOrder].cantidadtotal,
                        (parseNumber(ordenesTransporte[update.indexOrder].productos[update.indexProductoOrder].cantidaddisponible) - update.valueOrder)
                    );
                    if (ordenesTransporte[update.indexOrder].estado != OrdenTransporteEstadoEnum.CerradaConPendiente) {
                        // Si todos los productos de la orden poseen cant disponible == 0 debemos avanzarlo de estado.
                        const planillasOT: PlanillaArmado[] = await this.planillaArmadoService.findAll({"ordenestransporte.id": ordenesTransporte[update.indexOrder].id, estado: PlanillaArmadoEstadoEnum.Generada});                            
                        if (ordenesTransporte[update.indexOrder].productos.every((item) => item.cantidaddisponible == 0)) {
                            ordenesTransporte[update.indexOrder].estado = OrdenTransporteEstadoEnum.Despachada;
                        }
                        if (ordenesTransporte[update.indexOrder].estado == OrdenTransporteEstadoEnum.Despachada && planillasOT.length > 0) {
                            ordenesTransporte[update.indexOrder].estado = OrdenTransporteEstadoEnum.Preparacion;
                        }
                        if (ordenesTransporte[update.indexOrder].productos.some((item) => item.cantidaddisponible != 0) && planillasOT.length == 0) {
                            ordenesTransporte[update.indexOrder].estado = OrdenTransporteEstadoEnum.Pendiente;
                        }
                    }                    
                }

                if (update.deleted) {
                    pallet.productos[update.indexProductPallet].deleted = true
                } else {
                    // Actualizamos la cantidad del producto en el pallet.
                    pallet.productos[update.indexProductPallet].cantidad = update.valuePallet;
                }
            }

            await Promise.all(ordenesTransporte.map(orden => 
                this.ordenTransporteService.update(toString(orden._id), {productos: orden.productos, estado: orden.estado})
            )).catch(errorFn);
            
            pallet.productos = pallet.productos.filter((item) => item.cantidad > 0 && !item.deleted);
            return resolve (await this.update(toString(pallet._id), {productos: pallet.productos, estado: pallet.estado}));
        })
    }

    anularPallet(id:string, userId: string, skipUserValidation: boolean = false){
        return new Promise (async (resolve, reject)=> {
            if (!skipUserValidation) {
                const userInfo = await this.userConfigService.get(userId);
                if (userInfo.origenesid.length == 0) return reject({message: 'Error al obtener los datos del usuario.'});
            }
            
            const pallet = await this.findById(id);
            if (!pallet) return reject({message: 'Error al obtener los datos del pallet.'});
            
            if ([EstadoPalletEnum.Generado, EstadoPalletEnum.Liberado].indexOf(pallet.estado) < 0) {
                return reject({message: 'Error el pallet se encuentra en uso.'}) 
            }
            
            const ordenesTransporte = await this.ordenTransporteService.findAll({_id: {"$in": pallet.productos.map((item) => item.ordentransporteid)}});
            if (ordenesTransporte.length == 0) return reject({message: 'Error al obtener ordenes de entrega.'});

            // Verificamos que ninguna de las ordenes este bloqueadas.
            if(ordenesTransporte.some((item) => item.estado == OrdenTransporteEstadoEnum.Preparacion)) {
                return reject({message: 'No se puede anular porque una de las OE se encuentra en preparación.'});
            }
            
            // Actualizamos las ordenes de entrega.
            let message = "";
            pallet.productos.forEach(prod => {
                const ordenIndex = ordenesTransporte.findIndex((item) => item._id == prod.ordentransporteid);
                const prodIndex = ordenIndex < 0 ? -1 : ordenesTransporte[ordenIndex].productos.findIndex((item) => item.productoid == prod.productoid);
                let total = 0;
                let nuevaCantidad = 0;
                if (prodIndex >= 0) {
                    total = ordenesTransporte[ordenIndex].productos[prodIndex].cantidadtotal;
                    nuevaCantidad = ordenesTransporte[ordenIndex].productos[prodIndex].cantidaddisponible + prod.cantidad;                        
                }
                if (nuevaCantidad > total) message = 'Error al actualizar la cantidad disponible en orden de transporte.';
                ordenesTransporte[ordenIndex].productos[prodIndex].cantidaddisponible = nuevaCantidad;
            });
            if (message) return reject({message});

            // Actualizamos el estado de las OTs si es necesario
            for (const orden of ordenesTransporte) {
                if (orden.estado != OrdenTransporteEstadoEnum.CerradaConPendiente) {
                    const planillasOT: PlanillaArmado[] = await this.planillaArmadoService.findAll({"ordenestransporte.id": orden.id, estado: PlanillaArmadoEstadoEnum.Generada});
                    if (orden.productos.some(p => p.cantidadtotal != p.cantidaddisponible) && planillasOT.length == 0) {
                        orden.estado = OrdenTransporteEstadoEnum.Pendiente;
                    } else if (orden.productos.every(p => p.cantidadtotal == p.cantidaddisponible) && planillasOT.length == 0) {
                        orden.estado = OrdenTransporteEstadoEnum.Generada;
                    } else if (orden.estado == OrdenTransporteEstadoEnum.Despachada && planillasOT.length > 0) {
                        orden.estado = OrdenTransporteEstadoEnum.Preparacion;
                    }
                }
                this.ordenTransporteService.update(toString(orden._id), {
                    productos: orden.productos,
                    estado: orden.estado
                });
            }
            
            // Actualizamos el estado a Anulado.
            this.update(id, {
                estado: EstadoPalletEnum.Anulado, 
                nroplanilladespacho: '', 
                nroplanillarecepcion: '', 
                anuladopor: {userid: userId, fecha: new Date()}
            });
            return resolve(true);
        
        });
    }

    print(user: any, id: string, download: boolean): Promise<string> {
        return new Promise(async(resolve, reject) => {
            const username = user?.username;
            if (!username) return reject({message: 'Invalid Request'});
            let item = await this.get(user, false, id).catch(errorFn).catch(errorFn);
            if (!item) return reject({message: 'No se pudo encontrar informacion de pallet'}); 
            if (Array.isArray(item)) {
                if (item.length == 0) return reject({message: 'No se pudo encontrar informacion de pallet'});
                item = item[0];
            }
  
            const items = toArray(item.productos).filter(i => i.ordentransporte);

            let productos: {
                item: string,
                numerooe: string,
                codigo: string,
                nombre: string,
                producto: string,
                cantidad: string,
            }[] = items.filter(i => i).map((producto, index) => {
                return {
                    item: (index + 1).toString(),
                    numerooe: padLeadingZeros(producto.ordentransporte?.puntoventa, 4) + '-' + padLeadingZeros(producto.ordentransporte?.numberid, 8),
                    codigo: padLeadingZeros(producto.producto?.codigotruck, 6),
                    nombre: toString(producto.producto?.name),
                    producto: padLeadingZeros(producto.producto?.codigotruck, 6) + ' - ' + producto.producto?.name,
                    cantidad: this.parseNumber(producto.cantidad).toString(),
                }
            });

            productos = await this.printerService.completeArray('pallet', productos, 
                {
                    item: '',
                    numerooe: '',
                    codigo: '',
                    nombre: '',
                    producto: '',
                    cantidad: '',
                }
            );
            
            const data: PrinterDataItem[] = [
                {
                    name: 'numero',
                    value:  padLeadingZeros(item.numberid, 8)
                },{
                    name: 'direccion',
                    value: toString(item?.destino?.direccion),
                },{
                    name: 'fecha',
                    value: formatDate(new Date(toString(item.createdAt)), 0, false, "/"), 
                },{
                    name: 'estado',
                    value: toString(item.estado?.name).toUpperCase(),
                },{
                    name: 'productos',
                    value: JSON.stringify(productos),
                    isTable: true,
                },{
                    name: 'destino',
                    value: toString(item?.destino?.name),
                },
            ];       
           
            const fileName = await this.printerService.generate(username, "pallet", data, download);
            if (!fileName) return reject({message: 'No se pudo generar el pdf'}); 
            resolve(fileName);
        });
    }

    addProducts(palletId: string, productosAgregar: ProductoPalletRequest[]): Promise<Pallet | undefined> {
        return new Promise(async (resolve, reject) => {
            try {
                productosAgregar = productosAgregar.filter(p => parseNumber(p.cantidad) > 0);
                if (productosAgregar.length == 0) {
                    return reject({message: 'Verifique los parametros enviados.'});
                }
                
                const pallet = await this.findById(palletId);
                if (pallet?.estado != EstadoPalletEnum.Liberado && pallet?.estado != EstadoPalletEnum.Generado) {
                    return reject({message: 'No puede añadir productos a un pallet en uso.'});
                }

                const oeIds = new ArrayList();
                productosAgregar.forEach((item) => {
                    oeIds.push(item.ordentransporteid);
                });

                const ordenesTransporte = await this.ordenTransporteService.findAll({_id: {"$in": oeIds.get()}});

                if (!Array.isArray(ordenesTransporte) || ordenesTransporte.length == 0) return reject({message: 'Error al obtener ordenes relacionadas.'});
                if (ordenesTransporte.some((item) => item.destinoid != pallet.destinoid)) return reject({message: 'No es posible agregar materiales a un pallet cuyas ordenes poseen diferente destino.'});
                if (ordenesTransporte.some((item) => item.estado == OrdenTransporteEstadoEnum.Preparacion)) return reject({message: 'No es posible modificar la cantidad de un material cuya Orden de Entrega posee estado EN PREPARACION.'});
                if (ordenesTransporte.some((item) => ![OrdenTransporteEstadoEnum.Generada, OrdenTransporteEstadoEnum.Pendiente].includes(item.estado))) return reject({message: 'Alguna de las OE de los materiales a agregar esta en un estado distinto a GENERADA o PENDIENTE.'});
                
                // Array con los datos a agregar.
                const updates: {
                    indexOrder: number,
                    indexProductoOrder: number,
                    OP: 'reduce' | null,
                    valueOrder: number,
                    valuePallet: number
                }[] = [];

                let message = "";
                productosAgregar.forEach(newValue => {
                    const orderIndex = ordenesTransporte.findIndex((item) => item.id == newValue.ordentransporteid);
                    const prodInOrderIndex = orderIndex < 0 ? -1 : ordenesTransporte[orderIndex].productos.findIndex((item) => item.productoid == newValue.productoid);
                    if (prodInOrderIndex < 0) {
                        message = 'Error no existe el producto en la orden.';
                    } else {
                        const update: any = {
                            indexOrder: orderIndex,
                            indexProductoOrder: prodInOrderIndex,
                            OP: null,
                            valueOrder: 0,
                            valuePallet: parseNumber(newValue.cantidad)
                        }
                        // Obtenemos la cantidad a restar en la orden.
                        const valueToOrder = (newValue.cantidad);
                        if ((parseNumber(ordenesTransporte[orderIndex].productos[prodInOrderIndex].cantidaddisponible) - valueToOrder) < 0) {
                            message = 'No hay disponibilidad para las cantidades solicitadas.';
                        }
                        update.OP = 'reduce';
                        update.valueOrder = valueToOrder;
                        updates.push(update);
                    }
                })

                if (message) return reject({message});

                updates.forEach(update => {
                    if (update.OP == 'reduce') {
                        ordenesTransporte[update.indexOrder].productos[update.indexProductoOrder].cantidaddisponible = (parseNumber(ordenesTransporte[update.indexOrder].productos[update.indexProductoOrder].cantidaddisponible) - update.valueOrder);
                        // Si todos los productos de la orden poseen cant disponible == 0 debemos avanzarlo de estado.
                        if(ordenesTransporte[update.indexOrder].productos.every((item) => item.cantidaddisponible == 0)) ordenesTransporte[update.indexOrder].estado = OrdenTransporteEstadoEnum.Despachada;
                        // Si la orden se encuentra en un estado diferente de Pendiente debemos avanzarla a este estado.
                        else if(ordenesTransporte[update.indexOrder].estado != OrdenTransporteEstadoEnum.Pendiente) ordenesTransporte[update.indexOrder].estado = OrdenTransporteEstadoEnum.Pendiente;
                        this.ordenTransporteService.update(toString(ordenesTransporte[update.indexOrder]._id), {
                            productos: ordenesTransporte[update.indexOrder].productos,
                            estado: ordenesTransporte[update.indexOrder].estado
                        });
                    }
                    // Agregamos el producto al pallet.
                    pallet.productos.push({
                        ordentransporteid: toString(ordenesTransporte[update.indexOrder]._id),
                        productoid: ordenesTransporte[update.indexOrder].productos[update.indexProductoOrder].productoid,
                        cantidad: update.valuePallet,
                    });
                });

                resolve(await this.update(toString(pallet._id), {productos: pallet.productos.filter(item => item.cantidad > 0)}));
            } catch (error: any) {
                reject({messaje: error?.message || error || 'Error al agregar producto/s.'});
            }
        })
    }
    
    getOrders(user: JwtPayload, palletId: string, onlyCount: boolean): Promise<PalletCount | OrdenTransporteVM[]> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!palletId) return reject({message: 'Verifique los parametros enviados.'});
                const pallet = await this.findById(palletId);
                if (!pallet) return reject({message: 'Error al obtener la informacion del pallet.'});

                const ordenesTransporte = await this.ordenTransporteService.getAll(user, true,
                    {
                        onlyPenAndGen: true,
                        destino: [pallet.destinoid],
                        includestock: true,
                        includeInfoProductos: true,
                        includeTruckCode: false
                    }
                );
                if (!Array.isArray(ordenesTransporte)) return reject({message: 'Error al obtener la informacion de la OE.'});

                for (const ot of ordenesTransporte) {
                    ot.productos = ot.productos.filter(prod => 
                        !pallet.productos.some(i => i.productoid == toString(prod?.producto?.id, prod.productoid) && i.ordentransporteid == ot._id) && 
                        parseNumber(prod.cantidaddisponible) > 0);
                }
                
                const resp = ordenesTransporte.filter(i => Array.isArray(i.productos) && i.productos.length > 0);
                if (onlyCount) return resolve({count: resp.length});

                return resolve(resp);
            } catch (error: any) {
                return reject({messaje: error?.message || error || 'Error al obtener ordenes.'});
            }
        })
    }
}

export interface PalletUpdateBody {
    productoid: string;
    ordentransporteid: string,
    newCantidad: number;
    deleted?: boolean;
}

export interface CloseEnabledItem {
    idorden: string, 
    closeEnabled: boolean
}