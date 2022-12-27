import { HttpService } from '@nestjs/axios';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BaseFullService, DBName, configurationGet, JwtPayload, testIsRunning } from '@proguidemc/http-module';
import { PlanillaArmadoEstado, PlanillaArmadoEstadoEnum } from './model/planillaestado.model';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { PlanillaArmado, PlanillaArmadoVM } from './model/plantilla.model';
import { OrdenTransporteService } from '../ordentransporte/ordentransporte.service';
import { OrdenTransporteEstadoEnum } from '../ordentransporte/model/ordentransporteestado.model';
import { PlanillaEstadoService } from './planillaestado.service';
import { PalletVM, ProductoPallet } from '../pallet/model/pallet.model';
import { PrinterDataItem, PrinterService } from '../shared/printer/printer.service';
import { applyFilterWitthPermission, ArrayList, ElementName, errorFn, formatDate, hasCustomPermission, ORIGENID, padLeadingZeros, parseNumber, toArray, toString } from '../shared/utils/utils';
import { OrdenTransporte, OrdenTransporteVM } from '../ordentransporte/model/ordentransporte.model';
import { TableBufferService } from './tablebuffer.service';
import { TableBuffer } from './model/tablebuffer.model';
import { EstadoPalletEnum } from '../pallet/model/palletestado.model';
import { LugarVM } from '../shared/lugar/model/lugar.model';
import { Configuration } from '../shared/configuration/configuration.enum';
import { StockReservaInput, StockReservaInputItem, StockReservaService } from '../shared/legacy/services/stockreserva.service';
import { StockMovEnum } from '../stockmov/model/stockmovtipo.model';

@Injectable()
export class PlanillaService extends BaseFullService<PlanillaArmado> {
    
    constructor(
        @Inject(forwardRef(() => OrdenTransporteService)) public ordenTransporteService: OrdenTransporteService,   
        protected httpService: HttpService,
        protected userConfigService: UserConfigService,
        private planillaEstadoService: PlanillaEstadoService,
        private printerService: PrinterService,
        private tableBufferService: TableBufferService,        
        private stockReservaService: StockReservaService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'planillaarmado'}, httpService);
    }

    async test(user: JwtPayload) {
        const process = async () => {
            const orden = await this.ordenTransporteService.getOrdenTest('armado', user).catch(errorFn);
            
            await Promise.all([
                this.ordenTransporteService.targets("", "1"),
                this.ordenTransporteService.targets("", "", "1"),
                this.ordenTransporteService.targets("601803a13db4900043735668"),            
                this.ordenTransporteService.userConfigService.getUserInfo("", "mborgo"),
                this.ordenTransporteService.userConfigService.getUserInfo("601803a13db4900043735668"),   
                this.ordenTransporteService.userConfigService.getKeyToken("none"),   
            ]).catch(errorFn);
            
            const ordenId = toString(orden?._id);
            const productos = toArray(orden?.productos);
            if (productos.length > 0) {
                const planilla = await this.insert([ordenId], user).catch(errorFn);
                const planillaId = toString(planilla?._id);
                if (planillaId) {
                    await this.get(planillaId, user, false, true, false);
                    const productId = productos[0].productoid;
                    await this.stock_reserva(user, {
                        deposito: ORIGENID, 
                        productos: [
                            {producto: productId, cantidadnueva: 1},
                            {producto: productId, cantidadnueva: 1, cantidadanterior: 2},
                        ]}, 1000);
                
                    await this.tableBufferService.insert([{
                        cantidad: 1,
                        ordentransporteid: ordenId,
                        productoid: productId,
                        usuario: user.username,                    
                    }], user.username).catch(errorFn);

                    const items: ProductoPallet[] = [
                        {
                            ordentransporteid: ordenId,
                            productoid: productId,
                            cantidad: 10,
                            cantidadrecibida: 9,
                            motivo: {
                                faltante: -1,
                                sobrante: 0,
                                rotura: 1,
                                observacion: 'test'
                            },    
                        }
                    ];
                    const productId1 = productos.length > 1 ? productos[1].productoid : '';
                    if (productId1) {
                        items.push({
                            ordentransporteid: ordenId,
                            productoid: productId1,
                            cantidad: 10,
                            cantidadrecibida: 10,
                        });
                    }

                    await this.paletizar(user, planillaId, items, true, "pending", 1000).catch(errorFn);
                    
                    if (productId1) {
                        items[1].deleted = true;
                        items[0].cantidadrecibida = 10;
                        await this.paletizar(user, planillaId, items, true, "ready", 1000).catch(errorFn);
                    }

                    await this.finalized(planillaId, [], user).catch(errorFn);
                    await this.anular(planillaId, user.userId).catch(errorFn);
                    await this.getUsers(user, {}, true);
                }
            }

            return {status: "OK"};
        }

        await process().catch(errorFn);
        return {status: 'OK'};
    }

    private permissionOk(user: JwtPayload, elementName: ElementName): boolean {
        return hasCustomPermission(user, 'planillas de armado', elementName);
    }
    
    private stock_reserva(user: JwtPayload, info: StockReserva, timeout?: number): Promise<string> {
        return new Promise(async resolve => {
            const SAP_RESERVA_ENABLED = this.parseNumber(configurationGet(Configuration.SAP_RESERVA_ENABLED)) == 1 || testIsRunning();
            if (!SAP_RESERVA_ENABLED && !timeout) {                
                return resolve("");
            }
            
            const items : StockReservaInputItem[] = [];
            info.productos.filter(i => this.parseNumber(i.cantidadnueva) != this.parseNumber(i.cantidadanterior))
            .forEach(item => {
                const cantidadanterior = this.parseNumber(item.cantidadanterior);
                let cantidadnueva = this.parseNumber(item.cantidadnueva);
                
                if (cantidadanterior > 0) {
                    if (cantidadanterior < cantidadnueva) {
                        cantidadnueva = cantidadnueva - cantidadanterior;
                    } else {
                        // hay cambio de stock y la nueva cantidad es menor que la anterior, por ende hay q cancelar unidades de reserva. Aun no se puede hacer en sap
                        cantidadnueva = 0;
                    }
                }

                if (cantidadnueva > 0) {
                    const index = items.findIndex(i => i.producto == item.producto);
                    if (index < 0) {
                        items.push({
                            cantidad: cantidadnueva,
                            producto: item.producto,                            
                        });
                    } else {
                        items[index].cantidad = items[index].cantidad + cantidadnueva;
                    }
                }
            })

            if (items.length == 0) return resolve("");

            const params: StockReservaInput = {
                tipomov: StockMovEnum.reserva,
                deposito: info.deposito,
                items,              
            };
                        
            const productos = await this.stockReservaService.stockMovService.productService.findAll({id: {$in: params.items.map(i => i.producto)}});
            params.items.forEach(item => {
                item.producto = toString(productos.find(i => i._id == item.producto)?.codigosap);
            });

            const resp = await this.stockReservaService.post(user, params, timeout).catch(errorFn);                
            if (!timeout && (!resp || resp.message)) {
                return resolve("No se pudo realizar reserva en SAP. Observación: " + toString(resp?.message));
            }

            resolve("");
        });
    }

    async getUsers(user: JwtPayload, filter: any = {}, validateOrigins?: boolean) {
        const users = await this.userConfigService.findAll({});        
        const userInfo = users.find(item => item.userid == user.userId);

        const array = toArray(userInfo?.origenesid);
        if (array.length == 0) return [];
        
        if (validateOrigins) {
            const usersIds = new ArrayList();
            users.forEach(item => {
                if (item.origenesid.some(i => array.some(j => j == i))) {
                    usersIds.push(item.userid);
                }
            });
            if (usersIds.count() == 0) return [];
            filter["_id"] = {"$in": usersIds.get()};
        }
        
        return this.userConfigService.findUsers(filter);
    }

    async get(id: string, user: JwtPayload, full: boolean, excludeemptys: boolean, includestock: boolean) {
        return new Promise(async (resolve, reject) => {
            const userInfo = await this.userConfigService.get(user.userId);
            if (userInfo.origenesid.length == 0) return reject({message: 'El usuario no posee origen.'});

            const filter: any = {};

            const includeAll = this.permissionOk(user, 'include-all');
            const includeTargets = this.permissionOk(user, 'include-target');

            applyFilterWitthPermission(filter, includeAll, includeTargets, userInfo.origenesid);
            
            if (id) filter["_id"] = id;
            
            const planillas = await this.findAll(filter);
            const resp = await this.normalize(user, planillas, userInfo.origenesid, full, excludeemptys, includestock);
            if (id) {
                if (resp.length == 0) return reject({message: 'No se encontro la planilla'});
                return resolve(resp[0]);
            }

            resolve(resp);
        });
    }

    async insert(ordenestransporte: string[], user: JwtPayload): Promise<PlanillaArmado> {
        return new Promise(async (resolve, reject) => {
            if (ordenestransporte.length == 0 ) return reject({message: 'La cantidad de ordenes debe ser mayor a cero.'});
            
            const ordenes = await this.ordenTransporteService.findAll({id: {$in : ordenestransporte}});
            if (ordenes.length == 0) return reject({message: 'Error al obtener ordenes.'});
            if (!ordenes.every(o => o.origenid == ordenes.find(ot => ot)?.origenid)) return reject({message: 'Todas las órdenes deben tener el mismo origen.'})

            const body: PlanillaArmado = {
                usuario: user.username,
                estado: PlanillaArmadoEstadoEnum.Generada,
                ordenestransporte: ordenestransporte.map(id => ({id, productosExcluidos: []})),
                origenid: ordenes[0].origenid,
                pallets: []
            }

            await this.ordenTransporteService.updateMany(
                {
                    bloqueadopor: user.username,
                    estado: OrdenTransporteEstadoEnum.Preparacion
                }, {
                    _id: { $in: ordenestransporte }
                }
            );

            const item = await this.create(body);
            if (!item) return reject({message: 'No se pudo crear la planilla'});
            resolve(item);
        });
    }

    private normalize(user: JwtPayload, planillas: PlanillaArmado[], misOrigenes: string[],full: boolean, excludeemptys: boolean, includestock: boolean): Promise<PlanillaArmadoVM[]> {
        return new Promise(async resolve => {
            planillas = planillas.filter(i => i);
            if (planillas.length == 0) return resolve([]);
        
            const ordenIds = new ArrayList();
            const usuarioIds = new ArrayList();
            const entityIds = new ArrayList();
            const palletIds = new ArrayList();
            
            planillas.forEach(planilla => {
                planilla.ordenestransporte.forEach(orden => {
                    ordenIds.push(orden.id);
                });            
                usuarioIds.push(planilla.usuario);
                entityIds.push(planilla.origenid);            
                planilla.pallets.forEach(item => {
                    palletIds.push(item);
                });
            })

            const getPallets = async () => {
                if (!full) return [];
                return this.ordenTransporteService.palletService.getAll(user, await this.ordenTransporteService.palletService.findAll({_id: {$in: palletIds.get()}}), misOrigenes);
            }
                
            const usuarios: any[] = [];
            const ordenes: OrdenTransporteVM[] = [];
            const tableBuffer: TableBuffer[] = [];
            const entities: LugarVM[] = [];      
            const estados: PlanillaArmadoEstado[] = [];     
            const pallets: PalletVM[] = [];     

            await Promise.all([
                this.getUsers(user, {username: {$in: usuarioIds.get()}}, false),
                this.ordenTransporteService.getWithFilter(user, ordenIds.get(), includestock),
                this.planillaEstadoService.findAll({}),
                this.tableBufferService.findAll({usuario: user.username}),
                getPallets(),
                this.userConfigService.getInfoEntities(entityIds.get())
            ])
            .then(responses => {
                usuarios.push(...responses[0]);
                ordenes.push(...responses[1]);
                estados.push(...responses[2]);
                tableBuffer.push(...responses[3]);
                pallets.push(...responses[4]);
                entities.push(...responses[5]);
            })
            .catch(errorFn);
            
            if (usuarios.length == 0) return resolve([]);

            const resp: PlanillaArmadoVM[] = [];
            planillas.forEach(planilla => {
                const auxItem : PlanillaArmadoVM = ({
                    ...planilla,
                    usuario: usuarios.find(i => i.username == planilla.usuario),
                    estado: estados.find(i => i.id == planilla.estado),
                    destino: [],
                    ordenestransporte: [],
                    pallets: [],
                    origen: entities.find(i=>i.id == planilla.origenid),
                    viewenabled: misOrigenes.length == 0 || misOrigenes.indexOf(planilla.origenid) >= 0
                });

                const destinos: LugarVM[] = [];

                planilla.ordenestransporte.forEach(item => {
                    const itemOrden = ordenes.find((elm) => elm.id == item.id);
                    if (itemOrden) {
                        itemOrden.productos = itemOrden.productos.filter((prod) => !item.productosExcluidos.includes(prod.productoid))
                        
                        itemOrden.productos.forEach(p => {
                            const tb = tableBuffer.find(i => i.ordentransporteid == itemOrden.id && i.productoid == p.producto?.id);
                            if (tb) p.cantidad = tb.cantidad;
                        });

                        if (excludeemptys || planilla.estado == PlanillaArmadoEstadoEnum.Generada) {
                            itemOrden.productos = itemOrden.productos.filter(it => it.cantidaddisponible > 0);
                        }

                        if (itemOrden.destino && !destinos.some(i => i.id == itemOrden.destino?.id)) {
                            destinos.push(itemOrden.destino);
                        }

                        if (full && itemOrden.productos.length > 0) {
                            if (!auxItem.ordenestransporte) auxItem.ordenestransporte = [];
                            auxItem.ordenestransporte.push(itemOrden);
                        }
                    }
                });

                auxItem.destino = destinos;                
                if (full) auxItem.pallets = pallets.filter(i => planilla.pallets.some(j => j == i.id));
                
                resp.push(auxItem);
            });            
            return resolve(resp);
        });
    }

    async finalized(id: string, body: ProductoPallet[], user: JwtPayload): Promise<{filename?: string}> {
        return new Promise(async (resolve, reject) => {
            let filename = "";

            if (body.length > 0) {
                let message = "";
                await this.paletizar(user, id, body, false, "ready")
                .then(resp => {
                    if (toString(resp?.filename).length > 4) {
                        filename = toString(resp?.filename);
                    }
                })
                .catch(error => {
                    message = error?.message;
                });
                if (message) return reject({message});
            }

            const planilla = await this.findById(id);
            if (!planilla) return reject({message: "Planilla de armado no encontrada"});
                        
            const ordenesDeTransporte = await this.ordenTransporteService.findAll({_id: {$in: planilla.ordenestransporte.map(orden => orden.id)}});
            if (ordenesDeTransporte.length == 0) return reject({message: 'No se encontraron las ordenes de transporte'})

            ordenesDeTransporte.forEach(item => {
                let estadoo = OrdenTransporteEstadoEnum.Pendiente;
                if (item.productos.every((prod) => prod.cantidaddisponible == 0))
                    estadoo = OrdenTransporteEstadoEnum.Despachada;
                else if (item.productos.every((prod) => prod.cantidadtotal == prod.cantidaddisponible))
                    estadoo = OrdenTransporteEstadoEnum.Generada;
                this.ordenTransporteService.update(toString(item.id), {estado: estadoo});
            });

            const estado: PlanillaArmadoEstadoEnum = toArray(planilla.pallets).length == 0 ? 
                PlanillaArmadoEstadoEnum.Anulada : 
                PlanillaArmadoEstadoEnum.Paletizada;

            if (await this.update(id, {estado})) {
                return resolve({filename});
            }

            reject({message: 'No se pudo finalizar el paletizado'});
        });
    }

    async anular(id: string, userId: string){
        return new Promise(async (resolve, reject) => {
            if (!id || !userId) return reject({message: 'Verifique los parametros enviados.'});
            const userInfo = await this.userConfigService.get(userId);
            if (!userInfo) return reject({message: 'Error al obtener los datos del usuario.'});
            const planilla = await this.findById(id);
            if (!planilla) return reject({message: "No se encontró la planilla de armado"})
            const ordenesDeTransporte = await this.ordenTransporteService.findAll({_id: {$in: planilla.ordenestransporte.map(orden => orden.id)}});
            if (!Array.isArray(ordenesDeTransporte) || ordenesDeTransporte.length == 0) return reject({message: 'No se encontraron ordenes de transporte'})
            ordenesDeTransporte.forEach(item => {
                const itemId = toString(item.id);
                if (item.productos.every((prod) => prod.cantidaddisponible == 0))
                    this.ordenTransporteService.update(itemId, {estado: OrdenTransporteEstadoEnum.Despachada})
                if (item.productos.every((prod) => prod.cantidadtotal == prod.cantidaddisponible))
                    this.ordenTransporteService.update(itemId, {estado: OrdenTransporteEstadoEnum.Generada});
                else 
                    this.ordenTransporteService.update(itemId, {estado: OrdenTransporteEstadoEnum.Pendiente});
            });
            const pallets = await this.ordenTransporteService.palletService.findAll({_id: {"$in": planilla.pallets}, estado: {"$in": [EstadoPalletEnum.Liberado, EstadoPalletEnum.Generado]}});
            
            if(Array.isArray(pallets)) {
                pallets.forEach(pallet => {
                    this.ordenTransporteService.palletService.anularPallet(toString(pallet._id), userId, true);
                });
            }
            
            return resolve(await this.update(id, {estado: PlanillaArmadoEstadoEnum.Anulada}));
        });
    }
    
    paletizar(user: JwtPayload, idplanilla: string, productoPalletArray: ProductoPallet[], chep: boolean, type: 'ready' | 'pending', timeout?: number): Promise<{message?: string, filename?: string}> {
        return new Promise(async (resolve, reject) => {
            if (productoPalletArray.length == 0) return reject({message: 'Invalid Request'});

            const username = user.username;
            
            // Obtenemos planilla.
            const planillaArmado = await this.findById(idplanilla);
            if (!planillaArmado) return reject({message: 'Error planilla de armado no encontrada.'});

            const itemsAPaletizar: ProductoPallet[] = [];
            const ordenesDeTransporte: OrdenTransporte[] = [];
            
            if (type == 'ready') {
                // Chequear si el array de materiales que viene tiene las siguientes cartacteristicas:
                // 1. Todos los materiales con cantidad mayor a cero y que no esten eliminados, deben ser del mismo destino
                itemsAPaletizar.push(...productoPalletArray.filter(i => !i.deleted && parseNumber(i.cantidad) > 0));
                if (itemsAPaletizar.length > 0) {
                    ordenesDeTransporte.push(...await this.ordenTransporteService.findAll({_id: {$in: itemsAPaletizar.map(i => i.ordentransporteid)}}));  
                    const destinos = new ArrayList();                        
                    ordenesDeTransporte.forEach(item => {
                        destinos.push(item.destinoid);                                
                    });
                    if (destinos.count() != 1) {
                        return reject({message: 'Todos los productos del pallet deben poseer el mismo destino.'}); 
                    }
                }                
            }
                        
            const deletedItems = productoPalletArray.filter(i => i.deleted);
            const ordenes = new ArrayList();
            deletedItems.forEach(i => {
                ordenes.push(i.ordentransporteid);                    
            });

            const paramsSAP: StockReserva = {
                deposito: planillaArmado.origenid,
                productos: [], 
            }

            const promises = [];
            if (ordenes.count() > 0) {
                const ordenesn = await this.ordenTransporteService.findAll({_id: {$in: ordenes.get()}});
                const ordenesAActualizar = new ArrayList();
                let existeActualizacionPlanilla = false;
                ordenesn
                .filter(item => {
                    return deletedItems.some(i => i.ordentransporteid == item.id) && 
                            planillaArmado.ordenestransporte.some(i => i.id == item.id)
                })
                .forEach(item => {
                    // todos los materiales q vienen del frontend, eliminados, para una OE
                    const ordenTransporteItems = deletedItems.filter(i => i.ordentransporteid == item.id).map(i => i.productoid);

                    // todos los materiales excluidos de la OE que ya estan almacenados en la DB
                    const index = planillaArmado.ordenestransporte.findIndex(i => i.id == item.id);
                    const productosExcluidos = toArray(planillaArmado.ordenestransporte[index].productosExcluidos);

                    // todos los materiales que aun no estan en la DB, por ende tenemos que almacenar
                    const productosAConsiderar = ordenTransporteItems.filter(i => productosExcluidos.indexOf(i) < 0);
                    
                    if (productosAConsiderar.length > 0) {
                        productosExcluidos.push(...productosAConsiderar);
                        planillaArmado.ordenestransporte[index].productosExcluidos = productosExcluidos;
                        existeActualizacionPlanilla = true;
                    } 
                    // Si no existe ningun material a excluir, que no esté en la db, se debe chequear que la OE quede pendiente
                    else if (item.estado != OrdenTransporteEstadoEnum.Pendiente) {
                        ordenesAActualizar.push(item.id);
                    }
                });

                if (existeActualizacionPlanilla) {
                    promises.push(this.update(toString(planillaArmado.id), {ordenestransporte: planillaArmado.ordenestransporte}));
                }

                if (ordenesAActualizar.count() > 0) {
                    promises.push(this.ordenTransporteService.updateMany({estado: OrdenTransporteEstadoEnum.Pendiente}, {_id: {$in: ordenesAActualizar.get()}}));
                }
            }

            if (type == "ready") {
                let message = "";

                itemsAPaletizar.forEach(item => {
                    const order = ordenesDeTransporte.find((orden) => orden._id == item.ordentransporteid);
                    const prodInOrder = toArray(order?.productos).find((prod) => prod.productoid == item.productoid);
                    if (!prodInOrder) {
                        message = 'Producto no asociado a la orden de transporte.';
                    } else if ((parseNumber(prodInOrder.cantidaddisponible) - parseNumber(item.cantidad)) < 0) {
                        message = 'La cantidad solicitada excede a la disponible.';
                    } else {
                        paramsSAP.productos.push({
                            producto: item.productoid,
                            cantidadnueva: item.cantidad
                        });
                    }
                });
                if (message) return reject({message});

                message = await this.stock_reserva(user, paramsSAP, timeout);
                if (message) return reject({message});
            }

            promises.push(this.tableBufferService.deleteMany({usuario: username}));                                
            await Promise.all(promises).catch(errorFn)
            
            if (type == "pending") {
                // Añadimos buffer de tabla
                const tableBuffers: TableBuffer[] = productoPalletArray.map(p => ({
                    usuario: username,
                    ordentransporteid: p.ordentransporteid,
                    productoid: p.productoid,
                    cantidad: p.cantidad,
                }))
                await this.tableBufferService.createMany(tableBuffers);
                return resolve({message: 'La información se guardó correctamente'});                    
            }

            itemsAPaletizar.forEach(item => {
                const orden = ordenesDeTransporte.find(o => o._id == item.ordentransporteid);
                const producto = orden?.productos.find(p => p.productoid == item.productoid);
                if (producto) producto.cantidaddisponible = parseNumber(producto.cantidaddisponible) - parseNumber(item.cantidad);
            });

            await Promise.all(ordenesDeTransporte.map(orden => this.ordenTransporteService.update(toString(orden._id), {productos: orden.productos})))
            .catch(_error => {
                return reject({message: 'Error al actualiar orden de transporte.'});
            })

            let palletId = null;
            if (itemsAPaletizar.length > 0) {
                // Insertamos los pallets en la base de datos.
                const pallet = await this.ordenTransporteService.palletService.insert(user, itemsAPaletizar, chep, planillaArmado.origenid).catch(errorFn);
                palletId = pallet?.id;
                if (!palletId) return reject({message: 'No se pudo generar el pallet'});
                // Añadimos el pallet generado a la lista de pallets
                await this.update(toString(planillaArmado.id), {pallets: [...planillaArmado.pallets, palletId]});
            }
            
            const promisesDespachadas: any[] = [];
            ordenesDeTransporte
            .filter(orden => orden.productos.every((producto) => producto.cantidaddisponible == 0) && orden.estado != OrdenTransporteEstadoEnum.Despachada)
            .forEach(orden => {
                orden.estado = OrdenTransporteEstadoEnum.Despachada;
                promisesDespachadas.push(this.ordenTransporteService.update(toString(orden._id), {estado: OrdenTransporteEstadoEnum.Despachada}));
            });
            await Promise.all(promisesDespachadas).catch(errorFn);
            
            // Eliminamos de las ordenes los productos excluidos y verificamos las cantidades de todos los productos.
            
            let cantidaddisponibleTotal = 0;
            const ordenesa = await this.ordenTransporteService.findAll({
                estado: {$nin: [OrdenTransporteEstadoEnum.Despachada]}, 
                _id: {$in: planillaArmado.ordenestransporte.map(i => i.id)}
            });  
            ordenesa.forEach(orden => {
                const ordenEnPlanilla = planillaArmado.ordenestransporte.find((item) => item.id == orden._id);
                if (ordenEnPlanilla) {                    
                    orden.productos = orden.productos.filter((prod) => !ordenEnPlanilla.productosExcluidos.some(excluido => excluido == prod.productoid));
                    let disponibleEnOrden = 0; 
                    orden.productos.forEach(producto => {
                        disponibleEnOrden = disponibleEnOrden + producto.cantidaddisponible;
                    });
                    cantidaddisponibleTotal = cantidaddisponibleTotal + disponibleEnOrden;
                    // Si ya paletizamos todos los productos NO EXCLUIDOS de esta orden, debemos liberarla.
                    if (disponibleEnOrden == 0) this.ordenTransporteService.update(toString(orden._id), {estado: OrdenTransporteEstadoEnum.Pendiente});
                }
            });
            
            // Si ya no posee productos para enviar, actualizamos el estado de la planilla.
            if (cantidaddisponibleTotal == 0) {
                await this.update(toString(planillaArmado.id), {estado: PlanillaArmadoEstadoEnum.Paletizada});
            }
            
            if (palletId) {
                this.printPallet(user, palletId)
                .then(file => {
                    resolve({filename: file}); 
                })
                .catch(_error => {
                    resolve({filename: ''});
                })
            } else {
                resolve({filename: 'none'});
            }
        });
    }

    async print(user: any, id: string, download: boolean): Promise<string> {
        return new Promise(async(resolve, reject) => {
            const username = user?.username;
            if (!username) return reject({message: 'Invalid Request'});

            const planilla = await this.findById(id);
            if (!planilla) return reject({message: 'No se encontro la planilla'});
            const items = await this.normalize(user, [planilla], [], true, false, false);
            if (!Array.isArray(items) || items.length == 0) return reject({message: 'No se encontro la planilla'});
            const item = items[0];

            const destinos: {destino: string}[] = item.destino.map(d => {
                return {
                    destino: d?.name
                }
            });
            
            let productos: {
                plan: string,
                numerooe: string, 
                codigo: string,
                nombre: string,
                producto: string,
                cantidadtotal: string,
                cantidaddisponible: string,
                stock: string,
            }[] = [];

            toArray(item.ordenestransporte).filter(i => i.productos.length > 0)
            .forEach(orden => {
                orden.productos.forEach(producto => {
                    productos.push({
                        plan: toString(orden.plan?.name),
                        numerooe: padLeadingZeros(orden.puntoventa, 4) + '-' + padLeadingZeros(orden.numberid, 8),
                        codigo: padLeadingZeros(producto.producto?.codigotruck, 6),
                        producto: padLeadingZeros(producto.producto?.codigotruck, 6) + ' - ' + producto.producto?.name,
                        nombre: toString(producto.producto?.name),
                        cantidadtotal: this.parseNumber(producto.cantidadtotal).toString(),
                        cantidaddisponible: this.parseNumber(producto.cantidaddisponible).toString(),
                        stock: this.parseNumber(producto.producto?.stock).toString(),
                    });
                })
            });

            productos = await this.printerService.completeArray('planilla_armado', productos, 
                {
                    plan: '',
                    numerooe: '',
                    codigo: '',
                    nombre: '',
                    producto: '',
                    cantidadtotal: '',
                    cantidaddisponible: '',
                    stock: '',
                }
            );
            
            const data: PrinterDataItem[] = [
                {
                    name: 'numero',
                    value: padLeadingZeros(item.numberid, 6)
                },{
                    name: 'usuario',
                    value: item.usuario.username,
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
                    name: 'destinos',
                    value: JSON.stringify(destinos),
                    isTable: true,
                },
            ];       
           
            const fileName = await this.printerService.generate(username, "planilla_armado", data, download);

            if (!fileName) return reject({message: 'No se pudo generar el pdf'}); 
            resolve(fileName);
        });
            
    }

    async printPallet(user: any, id: string): Promise<string> {
        return this.ordenTransporteService.palletService.print(user, id, false);
    }

}

interface StockReserva {
    deposito: string,
    productos : {
        producto: string,
        cantidadnueva: number,
        cantidadanterior?: number,
    }[];    
}