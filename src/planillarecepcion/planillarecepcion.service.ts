import { HttpService } from '@nestjs/axios';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BaseFullService, configurationGet, DBName, JwtPayload, parseNumber, testIsRunning, toString } from '@proguidemc/http-module';
import { Pallet, ProductoPalletTipoMotivo } from '../pallet/model/pallet.model';
import { EstadoPalletEnum } from '../pallet/model/palletestado.model';
import { Usuario } from '../planillaarmado/model/plantilla.model';
import { Product } from '../producto/model/producto.model';
import { NotificationType } from '../shared/userconfig/userconfig.service';
import { formatDate, padLeadingZeros } from '../shared/utils/utils';
import { PlanillaRecepcion, PlanillaRecepcionProducto, PlanillaRecepcionVM } from './model/planillarecepcion.model';
import { PlanillaRecepcionEstado, PlanillaRecepcionEstadoEnum } from './model/planillarecepcionestado.model';
import { PlanillaRecepcionEstadoService } from './planillarecepcionestado.service';
import { PlanillaDespachoService } from '../planilladespacho/planilladespacho.service';
import { PlanillaDespacho, PlanillaDespachoVM } from '../planilladespacho/model/planilladespacho.model';
import { LugarVM } from '../shared/lugar/model/lugar.model';
import { PrinterDataItem, PrinterService } from '../shared/printer/printer.service';
import { PlanillaDespachoEstadoEnum } from '../planilladespacho/model/planilladespachoestado.model';
import * as utils from '../shared/utils/utils';
import { NotificationConfigService } from '../shared/notification-config/notification-config.service';
import { StockInterplantaInput, StockInterplantaService } from '../shared/legacy/services/stockinterplanta.service';
import { StockMovEnum } from '../stockmov/model/stockmovtipo.model';
import { Configuration } from '../shared/configuration/configuration.enum';
import { OrdenTransporte } from '../ordentransporte/model/ordentransporte.model';
import { OrdenTransporteEstadoEnum } from '../ordentransporte/model/ordentransporteestado.model';
import { replaceAll } from '@proguidemc/notification-module/lib/notification.functions';
import { UserInfo } from '../shared/userconfig/model/userconfig.model';

@Injectable()
export class PlanillaRecepcionService extends BaseFullService<PlanillaRecepcion> {

    constructor(
        protected httpService: HttpService,
        @Inject(forwardRef(() => PlanillaDespachoService)) public planillaDespachoService: PlanillaDespachoService,        
        public planillaRecepcionEstadoService: PlanillaRecepcionEstadoService,
        public printerService: PrinterService,
        private notificationConfigService: NotificationConfigService,
        private stockInterplantaService: StockInterplantaService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'planillarecepcion'}, httpService);
    }

    async test(user: JwtPayload) {
        const defaultDespacho: PlanillaDespacho = {
            estado: PlanillaDespachoEstadoEnum.Generada,
            idchofer: '',
            idoperador: '',
            idvehiculo: '',
            origenid: '',
            pallets: [],
            recepciones: [],
            usuario: user.username,                
        };
        let despacho: PlanillaDespacho = defaultDespacho;
        const pallets: Pallet[] = [];

        await Promise.all([
            this.planillaDespachoService.findOne({estado: "despachada"}),
            this.planillaDespachoService.palletService.findAll({nroplanillarecepcion: {$exists: false}})
        ])
        .then(resp => {
            if (resp[0]) despacho = resp[0];
            pallets.push(...resp[1]);
        })
        .catch(utils.errorFn);

        const planillas = utils.toArray(await this.generate(user, despacho).catch(utils.errorFn));
        if (planillas.length > 0) {
            const defPlanilla = {
                destinoid: '',
                estado: PlanillaRecepcionEstadoEnum.EnRecepcion,
                origenid: '',
                productos: [{
                    cantidadrecibida: 1,
                    cantidad: 1,
                    idproducto: '1',
                    nroordentransporte: '',
                    ordentransporteid: '',
                },{
                    cantidadrecibida: 5,
                    cantidad: 5,
                    idproducto: '1',
                    nroordentransporte: '',
                    ordentransporteid: '',
                }],
                usuario: user.username,
            };

            this.getInfoEstado([{
                cantidad: 10,
                cantidadrecibida: 9,
                motivo: {
                    faltante: -1,
                    observacion: 'test',
                    rotura: 1,
                    sobrante: 0,
                },
                idpallet: '1',
                idproducto: '1',
                ordentransporteid: '1'
            }], [{
                idpallet: '1',
                idproducto: '1',
                ordentransporteid: '1',
                cantidad: 10,
                nroordentransporte: '1',
            }]);

            await Promise.all([
                this.generate(user, defaultDespacho).catch(utils.errorFn),
                this.stock_recepcion(user, defPlanilla, false).catch(utils.errorFn),
                this.stock_recepcion(user, {...defPlanilla, productos: []}, false).catch(utils.errorFn),
                this.get({userId: '1', username: '1', roles: []}).catch(utils.errorFn),
            ])
            .catch(utils.errorFn);
            
            const planillaId = planillas[0];
            const items: PlanillaRecepcionBody[] = [{
                idpallet: utils.toString(pallets[0]._id),
                idproducto: pallets[0].productos[0].productoid,
                cantidadrecibida: 10,
                cantidad: 10,
                ordentransporteid: pallets[0].productos[0].ordentransporteid,
            }];

            await this.actualizarMaterialesPallet(user, planillaId, items, 'pending').catch(utils.errorFn);        
            await this.actualizarMaterialesPallet(user, planillaId, items, 'ready').catch(utils.errorFn);

            await Promise.all([
                this.sendNotification(NotificationType.LG_RECEPCION_PR, user, [planillaId]),
                this.sendNotification(NotificationType.LG_GENERACION_PR, user, [planillaId]),
            ]).catch(utils.errorFn);
        }

        await this.notificationConfigService.getUserToken("mborgo@proguidemc.com");
        await this.notificationConfigService.send({
            info: [{
                name: "link",
                value: "[URL]"
            }],
            rawHTML: "<html><body>[URL] [TOKEN]</body></html>",
            key: "test",
            target: [{
                email:"mborgo@proguidemc.com"
            }]
        });
        
        return {status: "OK"};
    }

    private stock_recepcion(user: JwtPayload, planilla: PlanillaRecepcion, testing: boolean): Promise<string> {
        return new Promise(async resolve => {
            const SAP_RECEPCION_ENABLED = this.parseNumber(configurationGet(Configuration.SAP_RECEPCION_ENABLED)) == 1 || testIsRunning();
            if (!SAP_RECEPCION_ENABLED) {                
                return resolve("");
            }

            const depositoorigen = planilla.origenid;
            const depositodestino = planilla.destinoid;

            const params: StockInterplantaInput = {
                depositoorigen, 
                items: [],
                tipomov: StockMovEnum.ingreso,
            };
            
            planilla.productos
            .filter(i => !i.recibido && this.parseNumber(i.cantidadrecibida) > 0)
            .forEach(item => {
                const cantidad = this.parseNumber(item.cantidadrecibida);
                const index = params.items.findIndex(i => i.producto == item.idproducto);
                if (index < 0) {
                    params.items.push({
                        cantidad,
                        depositodestino,
                        producto: item.idproducto,                            
                    });
                } else {
                    params.items[index].cantidad = params.items[index].cantidad + cantidad;
                }
                item.recibido = true;
            });

            if (params.items.length > 0) {
                const productos = await this.planillaDespachoService.palletService.productService.findAll({_id: {$in: params.items.map(i => i.producto)}});
                params.items.forEach(item => {
                    item.producto = productos.find(i => i._id == item.producto)?.codigosap;
                });

                const resp = await this.stockInterplantaService.post(user, params).catch(utils.errorFn);

                if (!resp?.nrocomercial) {
                    if (testing) return resolve("");
                    return resolve("No se pudo completar el movimiento en SAP. Observación: " + utils.toString(resp?.message));
                }
                
                await this.update(utils.toString(planilla._id), {
                    productos: planilla.productos,
                    infosap: {
                        nrocomercial: resp.nrocomercial, 
                        nrodoc: utils.toString(resp.nrodoc),
                    }
                });
            }

            resolve("");
        });
    }

    generate(user: JwtPayload, planilladespacho: PlanillaDespacho): Promise<string[]> {
        return new Promise(async(resolve, reject) => {
            const pallets = await this.planillaDespachoService.palletService.findAll({_id: {$in: planilladespacho.pallets}});
            const newItems: PlanillaRecepcion[] = [];
            const ordenIds = new utils.ArrayList();
            
            pallets.forEach(item => {
                item.productos.forEach(subitem => {
                    ordenIds.push(subitem.ordentransporteid);                    
                })
            });

            const ordenes = ordenIds.count() == 0 ? [] : await this.planillaDespachoService.palletService.ordenTransporteService.findAll({_id: {$in: ordenIds.get()}});
            if (ordenes.length == 0) return reject({message: 'No se encontraron ordenes de entrega'});

            const planIds = new utils.ArrayList();
            ordenes.forEach(item => {
                planIds.push(item.planid);                
            });
            const planes = (planIds.count() == 0) ? [] : await this.planillaDespachoService.palletService.ordenTransporteService.planService.findAll({id: {$in: planIds.get()}});
            if (planes.length == 0) return reject({message: 'No se encontraron planes'});

            const convertProducts = (pallet: Pallet): PlanillaRecepcionProducto[] => {
                return pallet.productos.map(item => {
                    const orden = ordenes.find(i => i.id == item.ordentransporteid);
                    const plan = planes.find(i => i.id == orden?.planid);
                    return {
                        cantidad: item.cantidad,
                        cantidadrecibida: item.cantidad,
                        idpallet: pallet._id,
                        idproducto: item.productoid,
                        ordentransporteid: item.ordentransporteid,
                        nroordentransporte: padLeadingZeros(orden?.puntoventa, 4) + '-' + padLeadingZeros(orden?.numberid, 8),
                        nropallet: pallet.numberid,
                        plan: plan?.name,
                    }
                }).filter(i => i.nroordentransporte.length > 5);
            }

            pallets.forEach(pallet => {
                let index = newItems.findIndex(i => i.destinoid == pallet.destinoid);
                if (index < 0) {
                    index = newItems.length;
                    newItems.push({
                        destinoid: pallet.destinoid,
                        estado: PlanillaRecepcionEstadoEnum.EnTransito,
                        nroplanilladespacho: planilladespacho.numberid,
                        origenid: planilladespacho.origenid,
                        planillaid: planilladespacho._id,
                        usuario: user.username,
                        productos: [],
                    })
                }
                newItems[index].productos = newItems[index].productos.concat(convertProducts(pallet));
            });

            const planillas = await this.createMany(newItems);
            if (Array.isArray(planillas)) {
                const planillaIds = planillas.map(i => utils.toString(i._id));
                const promises: {idpallet?: string, idplanilla?: string}[] = [];

                planillas.forEach(planilla => {
                    planilla.productos.forEach(producto => {
                        if (!promises.some(i => i.idpallet == producto.idpallet)) {
                            promises.push({
                                idpallet: producto.idpallet,
                                idplanilla: planilla.numberid
                            });
                        }
                    });
                });

                await Promise.all(promises.map(i => 
                    this.planillaDespachoService.palletService.update(utils.toString(i.idpallet), {nroplanillarecepcion: i.idplanilla})
                ))
                .catch(utils.errorFn);

                return resolve(planillaIds);
            }
            reject({message: 'No se pudo generar las ordenes de recepción'});
        });
    }

    private permissionOk(user: JwtPayload, elementName: utils.ElementName): boolean {
        return utils.hasCustomPermission(user, 'recepciones', elementName);
    }

    public async get(user: JwtPayload, id?: string, includeTruck: boolean = false, ignoreOrigin: boolean = false, customFilter:  any = {}): Promise<PlanillaRecepcionVM | PlanillaRecepcionVM[]> {
        return new Promise(async (resolve, reject) => {
            const userConfig = await this.planillaDespachoService.palletService.userConfigService.get(user?.userId);
            if (userConfig.origenesid.length == 0) return reject({message: 'El usuario no tiene origen asignado'});

            const filter: any = {};

            const includeAll = this.permissionOk(user, 'include-all');
            const includeTargets = this.permissionOk(user, 'include-target');

            // Si tiene permiso a ver todas las planillas, no se aplica filtro de origen
            if (!ignoreOrigin) {
                utils.applyFilterWitthPermission(filter, includeAll, includeTargets, userConfig.origenesid, true);                
            }

            if (id) {
                filter["_id"] = id;
            } else {
                filter["estado"] = {$in: [
                    PlanillaRecepcionEstadoEnum.EnTransito, 
                    PlanillaRecepcionEstadoEnum.Entregaparcial, 
                    PlanillaRecepcionEstadoEnum.Entregatotal,
                    PlanillaRecepcionEstadoEnum.EnRecepcion
                ]};
            }

            const items = await this.findAll({...filter, ...customFilter});
            const planillasDespachoIds = new utils.ArrayList();
            const filterEntities = new utils.ArrayList();
            const usuarioIds = new utils.ArrayList();
            const productoIds = new utils.ArrayList();

            items.forEach(item => {
                usuarioIds.push(item.usuario);
                usuarioIds.push(item.recibidopor);
                planillasDespachoIds.push(item.planillaid);
                filterEntities.push(item.origenid);
                filterEntities.push(item.destinoid);
                item.productos.forEach(producto => {
                    productoIds.push(producto.idproducto);
                });
            });

            const planillasDespacho: PlanillaDespachoVM[] = []; 
            const productos: Product[] = []; 
            const entities: LugarVM[] = [];
            const usuarios: Usuario[] = [];
            const estados: PlanillaRecepcionEstado[] = [];

            await Promise.all([
                this.planillaDespachoService.getNormalizedInfo(user, planillasDespachoIds.get(), []),
                this.planillaDespachoService.palletService.productService.findAll({_id: {$in: productoIds.get()}}),
                this.planillaDespachoService.palletService.userConfigService.getInfoEntities(filterEntities.get()),
                this.planillaDespachoService.palletService.userConfigService.findUsers({username: {$in: usuarioIds.get()}}),
                this.planillaRecepcionEstadoService.findAll({}),
            ])
            .then(responses => {
                planillasDespacho.push(...responses[0]);
                productos.push(...responses[1]);
                entities.push(...responses[2]);
                usuarios.push(...responses[3]);
                estados.push(...responses[4]);
            })
            .catch(utils.errorFn);
                        
            const resp: PlanillaRecepcionVM[] = [];
            items
            .filter(item => planillasDespacho.find(i => i._id == item.planillaid))
            .forEach(item => {
                resp.push({
                    ...item,
                    planilla: planillasDespacho.find(i => i._id == item.planillaid),
                    destino: entities.find(i => i.id == item.destinoid),
                    origen: entities.find(i => i.id == item.origenid),
                    estado: estados.find(i => i.id == item.estado),
                    usuario: usuarios.find(i => i.username == item.usuario),
                    recibidopor: item.recibidopor ? usuarios.find(i => i.username == item.recibidopor) : undefined,
                    productos: item.productos.map(i => {
                        return {
                            ...i,
                            producto: utils.toString(productos.find(j => j._id == i.idproducto)?.name),
                            codigotruck: includeTruck ? utils.toString(productos.find(j => j._id == i.idproducto)?.codigotruck) : undefined 
                        }
                    }),
                    viewenabled: userConfig.origenesid.indexOf(item.destinoid) >= 0
                });
            });

            if (id) {
                if (resp.length == 0) return reject({message: 'No se encontro información de la planilla'});
                resolve(resp[0]);
            }

            resolve(resp);
        });
    }

    private actualizarPlanillaDespacho(planillaid: string): Promise<void> {
        return new Promise(async resolve => {
            const items = await this.findAll({
                planillaid, 
                estado: PlanillaRecepcionEstadoEnum.EnTransito
            });

            if (items.length == 0) {                    
                await this.planillaDespachoService.update(planillaid, {estado: PlanillaDespachoEstadoEnum.Cerrada, fechacierre: formatDate()});
            }

            resolve();
        })
    }

    private getInfoEstado(body: PlanillaRecepcionBody[], productos?: PlanillaRecepcionProducto[]) {
        let estadoPlanilla = PlanillaRecepcionEstadoEnum.Entregatotal;
        let productosPlanilla: PlanillaRecepcionProducto[] = [];
        body.forEach(item => {
            const cantidad = this.parseNumber(item.cantidad);
            const cantidadrecibida = this.parseNumber(item.cantidadrecibida);
            const diff = cantidadrecibida - cantidad;
            const rotura = parseNumber(item.motivo?.rotura);
            // Creamos los productos de la planilla de recepcion con datos actualizados
            productosPlanilla = utils.toArray(productos).map(i => {
                if (i.idproducto == item.idproducto && i.idpallet == item.idpallet && i.ordentransporteid == item.ordentransporteid) {
                    i.cantidadrecibida = cantidadrecibida;
                    i.motivo = {
                        rotura,
                        observacion: toString(item.motivo?.observacion),
                        sobrante: Math.max(diff, 0),
                        faltante: Math.abs(Math.min(diff, 0)),
                    };
                }
                return i;
            });
            if (productosPlanilla.length > 0 && cantidad != cantidadrecibida) {
                estadoPlanilla = PlanillaRecepcionEstadoEnum.Entregaparcial;
            }
        });

        return {
            estadoPlanilla,
            productosPlanilla
        }
    }

    private async getInfoPlanilla(idPlanilla: string, body: PlanillaRecepcionBody[]) {
        const palletIds = new utils.ArrayList();
        const ordenesIds = new utils.ArrayList();
        body.forEach(i => {
            palletIds.push(i.idpallet);
            ordenesIds.push(i.ordentransporteid);
        });

        let planilla: PlanillaRecepcion | undefined;
        const allPallets: Pallet[] = [];
        const ordenes: OrdenTransporte[] = [];
        await Promise.all([
            this.findById(idPlanilla),
            this.planillaDespachoService.palletService.findAll({
                $or: [
                    {_id: {$in: palletIds.get()}}, 
                    {"productos.ordentransporteid": {$in: ordenesIds.get()}}
                ]
            }),
            this.planillaDespachoService.palletService.ordenTransporteService.findAll({_id: {$in: ordenesIds.get()}})
        ])
        .then(responses => {
            planilla = responses[0];
            allPallets.push(...responses[1]);
            ordenes.push(...responses[2]);
        });

        const bodyPallets: Pallet[] = [];
        const allPalletsOrdenes: Pallet[] = [];
        allPallets.forEach(i => {
            if (bodyPallets.indexOf(i) < 0 && palletIds.get().indexOf(utils.toString(i.id)) >= 0) {
                bodyPallets.push(i);
            }
            if (allPalletsOrdenes.indexOf(i) < 0 && i.productos.some(p => ordenesIds.get().indexOf(p.ordentransporteid) >= 0)) {
                allPalletsOrdenes.push(i);
            }
        });

        if (!planilla || bodyPallets.length != palletIds.count()) return undefined;
        return {
            planilla,
            ordenes,
            allPalletsOrdenes
        };
    }

    actualizarMaterialesPallet(user: JwtPayload, idPlanilla: string, body: PlanillaRecepcionBody[], status: 'pending' | 'ready'): Promise<void> {
        return new Promise(async(resolve, reject) => {
            if (body.length == 0) {
                return reject({message: 'Invalid request'});
            }
            const infoPlanilla = await this.getInfoPlanilla(idPlanilla, body);
            if (!infoPlanilla) return reject({message: 'No se encontro información de algun pallet de la planilla'});
            
            const planilla = infoPlanilla.planilla;
            const ordenes = infoPlanilla.ordenes;
            const allPalletsOrdenes = infoPlanilla.allPalletsOrdenes;
            const promises = [];

            const info = this.getInfoEstado(body, planilla.productos);
            if (status == 'ready') {
                const message = await this.stock_recepcion(user, planilla, utils.testIsRunning());
                if (message) return reject({message});
                promises.push(this.update(idPlanilla, {estado: info.estadoPlanilla, recibidopor: user.username, fecharecepcion: formatDate()}));
                promises.push(this.actualizarPlanillaDespacho(utils.toString(planilla.planillaid)))
                allPalletsOrdenes.forEach(pallet => {
                    if (pallet.estado == EstadoPalletEnum.Despachado && 
                        body.some(item => item.idpallet == pallet.id && 
                            (this.parseNumber(item.cantidad) != this.parseNumber(item.cantidadrecibida) || item.motivo?.rotura)
                        )
                    ) {
                        pallet.estado = EstadoPalletEnum.Recibidoconincidencias
                    } else {
                        pallet.estado = EstadoPalletEnum.Recibido
                    }
                    promises.push(this.planillaDespachoService.palletService.update(utils.toString(pallet.id), {estado:  pallet.estado}));
                });
            }

            if (info.productosPlanilla.length > 0) {
                promises.push(this.update(idPlanilla, {productos: info.productosPlanilla}));
            }

            // Si cada OE esta en estado despachada y todos los pallets a los que esta vinculada cada orden estan en estado recibidos, paso la OE a estado ENTREGADA
            ordenes.forEach(orden => {
                const palletsOrden = allPalletsOrdenes.filter(p => p.productos.some(i => i.ordentransporteid == orden.id));
                if (
                    orden.estado == OrdenTransporteEstadoEnum.Despachada 
                    && palletsOrden.every(p => [EstadoPalletEnum.Recibido, EstadoPalletEnum.Recibidoconincidencias].includes(p.estado))
                ) {
                    promises.push(this.planillaDespachoService.palletService.ordenTransporteService.update(utils.toString(orden._id), {estado: OrdenTransporteEstadoEnum.Entregada, fechaentrega: formatDate()}));
                }
            });

            Promise.all(promises)
            .then(_responses => {
                if (status == 'ready') this.sendNotification(NotificationType.LG_RECEPCION_PR, user, [utils.toString(planilla._id)]);
                resolve();
            })
            .catch(_error => {
                reject({message: 'No se pudo actualizar los pallets'});
            })
        })
    }

    async print(user: JwtPayload, id: string, download: boolean): Promise<string> {
        return new Promise(async(resolve, reject) => {
            const username = user.username;
            let planilla = await this.get(user, id, true).catch(utils.errorFn);
            if (Array.isArray(planilla)) {
                if (planilla.length <= 0) return reject({message: 'No se encontro la planilla'});
                planilla = planilla[0];
            } else if (!planilla) {
                return reject({message: 'No se encontro la planilla'});
            }
            
            let productos: {
                plan: string,
                numerooe: string, 
                pallet: string,
                codigo: string,
                producto: string,
                nombre: string,
                cantidad: string,
            }[] = [];
            
            planilla.productos.forEach(prod => {
                productos.push({
                    plan: utils.toString(prod.plan),
                    numerooe: prod.nroordentransporte, 
                    pallet: utils.toString(prod.nropallet),
                    codigo: padLeadingZeros(prod.codigotruck, 6),
                    producto: padLeadingZeros(prod.codigotruck, 6) + ' - ' + prod.producto,                            
                    nombre: prod.producto,
                    cantidad: this.parseNumber(prod.cantidad).toString(),
                })
            });

            productos = await this.printerService.completeArray('planilla_recepcion', productos, 
                {
                    plan: '',
                    numerooe: '',
                    pallet: '',
                    codigo: '',
                    nombre: '',
                    producto: '',
                    cantidad: '',
                }
            );
            
            const data: PrinterDataItem[] = [
                {
                    name: 'numero',
                    value: padLeadingZeros(planilla.numberid, 6)
                },{
                    name: 'numerodespacho',
                    value: padLeadingZeros(planilla.nroplanilladespacho,8)
                },{
                    name: 'origen',
                    value: utils.toString(planilla.origen?.name),
                },{
                    name: 'productos',
                    value: JSON.stringify(productos),
                    isTable: true,
                },{
                    name: 'destino',
                    value: utils.toString(planilla.destino?.name),
                },{
                    name: 'patente',
                    value: utils.toString(planilla.planilla?.vehiculo?.patente),
                },{
                    name: 'fecha',
                    value: formatDate(new Date(utils.toString(planilla.createdAt)), 0, false, "/"), 
                },{
                    name: 'operador',
                    value: utils.toString(planilla.planilla?.operador?.nombre),
                },{
                    name: 'posiciones',
                    value: utils.parseNumber(planilla.planilla?.vehiculo?.posiciones).toString(),
                },{
                    name: 'chofer',
                    value: utils.toString(planilla.planilla?.chofer?.nombrecompleto),
                }
            ];   
            
            const fileName = await this.printerService.generate(username, "planilla_recepcion", data, download);
            if (!fileName) return reject({message: 'No se pudo generar el pdf'}); 
            return resolve(fileName);
        });            
    }

    private async getInfoNotification(user: JwtPayload, key: NotificationType, destinoIds: string[], origenIds: string[], planillapdIds: string[], productoIds: string[]): Promise<PlanillaInfoNotification> {
        const userTM: UserInfo[] = [] 
        const userLG: UserInfo[] = []
        const planillaspd: PlanillaDespachoVM[] = [];
        const lugares: LugarVM[] = [];
        const productos: Product[] = [];        
                
        await Promise.all([
            this.planillaDespachoService.palletService.userConfigService.getInfoEntities(destinoIds.concat(origenIds)),
            this.planillaDespachoService.getNormalizedInfo(user, planillapdIds, key == NotificationType.LG_RECEPCION_PR ? [] : origenIds),
            this.planillaDespachoService.palletService.productService.findAll({_id: {$in: productoIds}}),
            this.planillaDespachoService.palletService.userConfigService.getUsersFromRoles(origenIds, "tm"),
            this.planillaDespachoService.palletService.userConfigService.getUsersFromRoles((key == NotificationType.LG_RECEPCION_PR) ? origenIds : destinoIds, "logistica"),
        ]) 
        .then(responses => {
            lugares.push(...responses[0]);
            planillaspd.push(...responses[1]);
            productos.push(...responses[2]);
            userTM.push(...responses[3]);
            userLG.push(...responses[4]);
        })
        .catch(utils.errorFn)

        let message = "";
        if (planillaspd.length == 0) message = "No se encontraron planillas de despacho"
        else if (productos.length == 0) message ="No se encontraron productos"
        else if (lugares.length == 0) message = "No se encontraron lugares";

        return {
            message,
            userTM,
            userLG,
            planillaspd,
            lugares,
            productos,                
        }
    }

    private async processArrayNotification(key: NotificationType, planillas: PlanillaRecepcion[], info: PlanillaInfoNotification) {
        const array: {planilla: PlanillaRecepcion, html: string | void}[] = [];

        let index = 0;
        for (const planilla of planillas) {
            const destino = info.lugares.find(i => i.id == planilla.destinoid);
            const origen = info.lugares.find(i => i.id == planilla.origenid);
            const planillapd = info.planillaspd.find(i => i.id == planilla.planillaid);
            if (origen && destino && planillapd) {
                const html = await this.notificationConfigService.notificationService.getHTML({
                    key,
                    info: [
                        {
                            name: 'numberidpd',
                            value: padLeadingZeros(planillapd.numberid, 6),
                        },{
                            name: 'numberid',
                            value: padLeadingZeros(planilla.numberid, 6),
                        },{
                            name: 'usuariodisplay',
                            value: index == 0 ? 'flex' : 'none'
                        },{
                            name: 'multiple',
                            value: planillas.length > 1 ? 'flex' : 'none'
                        },{
                            name: 'simple',
                            value: planillas.length > 1 ? 'none' : 'flex',
                        },{
                            name: 'link',
                            value: key == NotificationType.LG_RECEPCION_PR ? 
                            `[URL]/shipping/dispatch/detail-view/${planilla.planillaid}/[TOKEN]` :
                            `[URL]/receive/detail-view/${planilla.id}/[TOKEN]`
                        },{
                            name: 'origen',
                            value: origen.name,
                        },{
                            name: 'destino',
                            value: destino.name,
                        },{
                            name: 'footerdisplay',
                            value: index == (planillas.length - 1) ? 'block' : 'none'
                        },{
                            name: 'usuario',
                            value: '[USUARIO]'
                        },{
                            name: 'productos',
                            value: planilla.productos.map(i => {
                                const producto = info.productos.find(p => p.id == i.idproducto);
                                const motivo: string[] = [];
                                if (i.motivo?.faltante) {
                                    motivo.push('Faltante');
                                } 
                                
                                if (i.motivo?.sobrante) {
                                    motivo.push('Sobrante');
                                }
                                if (i.motivo?.rotura) {
                                    motivo.push('Rotura');
                                }
                                return {
                                    nroordentransporte: i.nroordentransporte,
                                    nropallet: padLeadingZeros(i.nropallet, 8),
                                    codmaterial: padLeadingZeros(producto?.codigotruck, 6),
                                    producto: producto?.name,
                                    cantidad: i.cantidad,
                                    cantidadrecibida: i.cantidadrecibida,
                                    diferencia: this.parseNumber(i.cantidad) - this.parseNumber(i.cantidadrecibida),
                                    motivo: motivo.join(" - "),
                                    plan: i.plan,
                                }
                            })
                        },          
                    ],
                }).catch(utils.errorFn);

                array.push({
                    planilla,
                    html
                });
            }
            index++;
        }

        return array;
    }

    async sendNotification(key: NotificationType, user: JwtPayload, planillaIds: string[]): Promise<string> {
        const planillas = await this.findAll({_id: {$in: planillaIds}});
        if (planillas.length == 0) return "No se encontraron planillas para enviar";
      
        const origenIds = new utils.ArrayList();
        const destinoIds = new utils.ArrayList();
        const planillapdIds = new utils.ArrayList();
        const productoIds = new utils.ArrayList();
        const planIds = new utils.ArrayList();

        planillas.forEach(item => {
            origenIds.push(item.origenid);
            destinoIds.push(item.destinoid);
            planillapdIds.push(item.planillaid);
            item.productos.forEach(p => {
                productoIds.push(p.idproducto);
                planIds.push(p.plan);
            });
        });

        const info = await this.getInfoNotification(user, key, destinoIds.get(), origenIds.get(), planillapdIds.get(), productoIds.get());
        if (info.message) {
            return info.message;
        }

        const array = await this.processArrayNotification(key, planillas, info);

        if (key == NotificationType.LG_RECEPCION_PR) {
            this.sendNotificationRecepcion(info.userLG, info.userTM, array);
        } else {
            this.sendNotificationGeneracion(info.userLG, info.userTM, array);
        }
        
        return "";
    }

    private async sendNotificationRecepcion(_userLG: any[], _userTM: any[], array: any[]) {
        const userLGF: UserInfo[] = _userTM;
        _userLG.forEach(item => {
            if (!userLGF.some(i => i.id == item.id)) {
                userLGF.push(item)
            }
        });
        
        for (const userl of userLGF) {
            const items = array.filter(item => userl.config?.origenesid.includes(item.planilla.origenid)).map(i => i.html).join("") 
            const token = await this.notificationConfigService.getUserToken(userl.email);
            this.notificationConfigService.send({
                key: NotificationType.LG_RECEPCION_PR,
                info: [],
                rawHTML: replaceAll(replaceAll(items, "[USUARIO]", userl.firstName + ' ' + userl.lastName), '[TOKEN]', token),
                target: [{
                    name: userl.firstName + ' ' + userl.lastName,
                    email: userl.email,
                }]
            });
        }
        
    }

    private async sendNotificationGeneracion(_userLG: any[], _userTM: any[], array: any[]) {
        const userTMF: UserInfo[] = [];       
        _userLG.forEach(item => {
            if (!_userTM.some(i => i.id == item.id)){
                userTMF.push(item)
            } 
        })
        
        //Este es solamente para los de LG, que se solicitan en la generación de planillas de recepción.
        // Se recorre entre los usuarios de tm y los usuarios de lg filtrados para que no envíe dos mails a un usuario con ambos roles.
        for (const userm of _userTM) {
            const items = array.filter(item => userm.config?.origenesid.includes(item.planilla.origenid)).map(i => i.html).join("")
            const token = await this.notificationConfigService.getUserToken(userm.email);
            this.notificationConfigService.send({
                key: NotificationType.LG_GENERACION_PR,
                info: [],
                rawHTML: replaceAll(replaceAll(items, "[USUARIO]", userm.firstName + ' ' + userm.lastName), '[TOKEN]', token),
                target: [{
                    name: userm.firstName + ' ' + userm.lastName,
                    email: userm.email,
                }]
            });
        }
        
        for (const usert of userTMF) {
            const items = array.filter(item => usert.config?.origenesid.includes(item.planilla.destinoid)).map(i => i.html).join("")
            const token = await this.notificationConfigService.getUserToken(usert.email);
            this.notificationConfigService.send({
                key: NotificationType.LG_GENERACION_PR,
                info: [],
                rawHTML: replaceAll(replaceAll(items, "[USUARIO]", usert.firstName + ' ' + usert.lastName), '[TOKEN]', token),
                target: [{
                    name: usert.firstName + ' ' + usert.lastName,
                    email: usert.email,
                }]
            });
        }
    }

    reception(id: string): Promise<void> {
        return new Promise (async (resolve, reject) => {
            if (!id) return reject({message: 'No se encontró la planilla de recepción'})
            const planilla = await this.findById(id)
            if (!planilla) return reject({message: 'No se pudo encontrar la planilla de recepción'})
            if (await this.update(utils.toString(planilla.id), {estado: PlanillaRecepcionEstadoEnum.EnRecepcion})) {
                resolve()
            } else reject ({ message: 'No se pudo recepcionar la planilla'});
        })
    }    
}

export interface PlanillaRecepcionBody {
    idpallet: string, 
    idproducto: string, 
    cantidadrecibida: number, 
    cantidad: number, 
    motivo?: ProductoPalletTipoMotivo,
    ordentransporteid: string,  
}

interface PlanillaInfoNotification {
    userTM: UserInfo[];
    userLG: UserInfo[];
    planillaspd: PlanillaDespachoVM[];
    lugares: LugarVM[];
    productos: Product[];
    message?: string;
}