import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ArrayList, BaseFullService, configurationGet, DBName, JwtPayload, toArray, toString } from '@proguidemc/http-module';
import { OrdenTransporte, OrdenTransporteVM } from './model/ordentransporte.model';
import { OrdenTransporteEstadoService } from './ordentransporteestado.service';
import { NotificationType, UserConfigService } from '../shared/userconfig/userconfig.service';
import { PlanService } from '../shared/plan/plan.service';
import { Plan } from '../shared/plan/model/plan.model';
import { ProductDTO } from '../producto/model/producto.model';
import { OrdenTransporteEstado, OrdenTransporteEstadoEnum } from './model/ordentransporteestado.model';
import { formatDate, padLeadingZeros } from '../shared/utils/utils';
import { LugarVM } from '../shared/lugar/model/lugar.model';
import { CloseEnabledItem, PalletService } from '../pallet/pallet.service';
import * as utils from '../shared/utils/utils';
import { NotificationConfigService } from '../shared/notification-config/notification-config.service';
import { replaceAll } from '@proguidemc/notification-module/lib/notification.functions';
import { Configuration } from '../shared/configuration/configuration.enum';
import { UserInfo } from '../shared/userconfig/model/userconfig.model';
import { PrioridadService } from './prioridad.service';
import { Prioridad } from './model/prioridad.model';

@Injectable()
export class OrdenTransporteService extends BaseFullService<OrdenTransporte> {

    constructor(
        public ordenTransporteEstadoService: OrdenTransporteEstadoService,  
        public planService: PlanService,
        public palletService: PalletService,
        protected httpService: HttpService,      
        public userConfigService: UserConfigService,
        private notificationConfigService: NotificationConfigService,
        private prioridadService: PrioridadService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'ordentransporte'}, httpService);
    }
    
    priorities() {
        return this.prioridadService.findAll({});
    }

    async getOrdenTest(_origin: string, _user: JwtPayload) {
        return this.findOne({origenid: utils.ORIGENID}).catch(utils.errorFn);        
    }

    private permissionOk(user: JwtPayload, elementName: utils.ElementName): boolean {
        return utils.hasCustomPermission(user, 'ordenes de entrega', elementName);
    }
    
    async getWithFilter(user: JwtPayload, ordenIds: string[], includestock: boolean, includeTruckCode?: boolean): Promise<OrdenTransporteVM[]> {
        return this.normalize(user, await this.findAll({_id: {$in: ordenIds}}), [], true, includestock, includeTruckCode);
    }

    async getId(user: JwtPayload, id: string | OrdenTransporte, includeStock: boolean, includeTruckCode: boolean) {
        const item = typeof id == 'string' ? await this.findById(id) : id;
        if (!item) return null;
        const items = await this.normalize(user, [item], [], true, includeStock, includeTruckCode);
        return Array.isArray(items) && items.length > 0 ? items[0] : null;
    }

    async getPlans(_userId: string, planesId?: string[]) {
        const filter: any = planesId ? {id: {$in: planesId}} : {};
        const items = await this.planService.findAll(filter);
        return items.map(item => {
            return {
                id: item.id,
                name: item.name,
                description: item.description,
                enabled: item.enabled,
            }
        });
    }
    
    async getProducts(_userId: string, notInOrderID: string, onlyCount: boolean, truckAsId: boolean) {
        let filters: any = { estado: 'ACTIVO' };
        if(notInOrderID) {
            const orden = await this.findById(notInOrderID);
            if (!orden) return [];
            if (Array.isArray(orden.productos) && orden.productos.length > 0) filters = {
                ...filters,
                _id: {$nin: orden.productos.map((item) => item.productoid)}
            }
        }

        if (onlyCount) {
            const count = await this.palletService.productService.count(filters);
            return {count};
        }

        const items = await this.palletService.productService.findAll(filters);
        return items.map(i => {
            return {
                id: truckAsId ? (i.codigotruck || i.id) : i.id,
                name: i.name,
                nomenclatura: i.nomenclatura,
                codigosap: i.codigosap,
                codigotruck: i.codigotruck,
                stock: i.stock,
            }
        });
    }
    
    async getPendings(user: JwtPayload): Promise<OrdenTransporteVM[]> {
        const items = await this.findAll({usuario: user.username, estado: OrdenTransporteEstadoEnum.EnEdicion});
        return this.normalize(user, items, [], false, false, false);
    }

    async targets(userId?: string, regionid?: string, recibede?: string): Promise<LugarVM[]> {
        if (recibede) return this.userConfigService.getInfoEntitiesForRecibede(recibede.split(","));
        if (regionid) return this.userConfigService.getInfoEntitiesForRegion(regionid);
        return this.userConfigService.getTargetsForUser(userId);
    }
    
    async save(state: OTCreateType, body: DeliveryGenerateTableInfo[], user: JwtPayload, origenid?: string): Promise<OrdenTransporte[]> {
        return new Promise(async(resolve, reject) => {
            if (!origenid) {
                const config = await this.userConfigService.get(user.userId);
                if (toArray(config.origenesid).length == 0) {
                    return reject({message: 'El usuario no tiene origen configurado'});
                }
                origenid = config.origenesid[0];
            }

            const prioridades = await this.priorities();
            const productosIds = new ArrayList();
            const newItems: OrdenTransporte[] = [];

            body.filter(item => this.parseNumber(item.cantidad) > 0)
            .forEach(item => {
                productosIds.push(item.material);
                const cantidad = this.parseNumber(item.cantidad);
                const index = newItems.findIndex(i => i.planid == item.plan && i.destinoid == item.cliente);
                const prioridad = prioridades.find((elm) => elm.id === item.prioridadid);
                const fechaestimada = item.fechaproveedor ? this.getEstimatedDate(item.fechaproveedor, utils.parseNumber(prioridad?.days)) : utils.toString(item.fechaproveedor);
                if (index < 0) {
                    newItems.push({
                        destinoid: item.cliente,
                        estado: state == 'pending' ? OrdenTransporteEstadoEnum.EnEdicion : OrdenTransporteEstadoEnum.Generada,
                        fechaestimada: fechaestimada,
                        origenid: utils.toString(origenid),
                        planid: item.plan,
                        productos: [{
                            cantidaddisponible: cantidad,
                            cantidadtotal: cantidad,
                            productoid: item.material,
                        }],
                        puntoventa: '1',
                        usuario: user.username,
                        fechaproveedor: item.fechaproveedor,
                        prioridadid: item.prioridadid,
                        nroordencompra: item.nroordencompra
                    });
                } else if (!newItems[index].productos.some(i => i.productoid == item.material)) {
                    newItems[index].productos.push({
                        cantidaddisponible: cantidad,
                        cantidadtotal: cantidad,
                        productoid: item.material,
                    })   
                }
            });
            
            if (newItems.length == 0) {
                return reject({message: "No se generaron nuevas ordenes"});
            }

            const productoItems = await this.palletService.productService.findAll({codigotruck: {$in: productosIds.get()}});
            const createItems: OrdenTransporte[] = [];
            let message = "";
            newItems.forEach(item => {
                item.productos.forEach(it => {
                    it.productoid = utils.toString(productoItems.find(i => i.codigotruck == it.productoid)?.id);
                    if (!it.productoid) message = "No se pudo encontrar informacion de material";
                });
                createItems.push(item);
            });

            if (message) return reject({message});

            // Eliminar las OTs en edicion del usuario, que no estan en el BODY
            await this.deleteMany({
                usuario: user.username, 
                estado: OrdenTransporteEstadoEnum.EnEdicion
            });

            this.createMany(createItems)
            .then(resp => {
                if (state == 'ready') {
                    this.sendNotification(user, toArray(resp));
                }
                resolve(toArray(resp));
            })
            .catch(error => {
                reject({message: JSON.stringify(error)});
            });
        })
    }

    private async normalize(user: JwtPayload, items: OrdenTransporte[], misOrigenes: string[], includeInfoProductos: boolean, includestock: boolean, includeTruckCode?: boolean): Promise<OrdenTransporteVM[]> {
        if (items.length == 0) return [];

        const entities: LugarVM[] = [];
        const planes: Plan[] = [];
        const productos: ProductosOrigenOUT[] = [];
        
        const productoIds = new utils.ArrayList();
        const entityIds = new utils.ArrayList();
        const planIds = new utils.ArrayList();
        const ordenIds = new utils.ArrayList();
        const productoPorOrigenIds = new utils.ArrayComplexList();

        const closeEnabledItems: CloseEnabledItem[] = []; 
        const estados: OrdenTransporteEstado[] = [];
        
        items.forEach(item => {
            item.productos.forEach(i => {
                productoIds.push(i.productoid);            
                productoPorOrigenIds.push(item.origenid, i.productoid);
            });

            entityIds.push(item.origenid);
            planIds.push(item.planid);        
            entityIds.push(item.destinoid);
        
            if (item.estado == OrdenTransporteEstadoEnum.Pendiente) {
                ordenIds.push(item.id);
            }
        });        

        const getInfoProducts = async (): Promise<ProductosOrigenOUT[]> => {
            if (!includeInfoProductos) return [];

            if (includestock) {
                const productoItems: ProductosOrigenOUT[] = [];
                
                const getProductoPorOrigen = async (item: utils.ArrayComplexItem): Promise<ProductosOrigenOUT> => {
                    return {
                        idorigen: item.id,
                        productos: await this.palletService.productService.findAllConvert({_id: {$in: item.items}}, false, user.username, item.id)
                    }
                }

                await Promise.all(productoPorOrigenIds.get().map(item => getProductoPorOrigen(item)))
                .then(responses => {
                    productoItems.push(...responses);                    
                })
                .catch(utils.errorFn);

                return productoItems;
            }

            return [{
                idorigen: '',
                productos: await this.palletService.productService.findAllConvert({_id: {$in: productoIds.get()}}, false, user.username)
            }]
        }

        const prioridades: Prioridad[] = [];
        await Promise.all([
            getInfoProducts(),
            this.userConfigService.getInfoEntities(entityIds.get()),            
            this.planService.findAll({id: {$in: planIds.get()}}),
            this.ordenTransporteEstadoService.findAll({}),
            this.palletService.getOTCloseEnabled(ordenIds.get()),
            this.priorities(),
        ])
        .then(responses => {
            productos.push(...responses[0]);
            entities.push(...responses[1]);
            planes.push(...responses[2]);
            estados.push(...responses[3]);
            closeEnabledItems.push(...responses[4]);
            prioridades.push(...responses[5]);
        })
        .catch(utils.errorFn)
                
        return items.map(item => {
            return {
                ...item,
                origen: entities.find(i => i.id == item.origenid),
                destino: entities.find(i => i.id == item.destinoid),
                fechaactual: formatDate(),
                plan: planes.find(i => i.id == item.planid),
                estado: estados.find(i => i.id == item.estado),
                puntoventa: padLeadingZeros(item.puntoventa, 4),
                numberid: padLeadingZeros(item.numberid, 8),
                productos: item.productos.map(subitem => {
                    const producto = productos.find(i => ["", item.origenid].indexOf(i.idorigen) >= 0)?.productos?.find(i => i.id == subitem.productoid);
                    return {
                        ...subitem,
                        productoid: subitem.productoid,
                        producto,
                        codigotruck: includeTruckCode ? producto?.codigotruck : undefined,
                    }
                }),
                nroordencompra: padLeadingZeros(toString(item.nroordencompra), 8),
                closeenabled: closeEnabledItems.find(i => i.idorden == item.id)?.closeEnabled || false,
                viewenabled: misOrigenes.length == 0 || misOrigenes.indexOf(item.origenid) >= 0,
                prioridad: prioridades.find(i => i.id == item.prioridadid),
            }
        });
    }

    async getCustomAll(user: JwtPayload, filter: any, excludeControlUser: boolean): Promise<OrdenTransporteVM[]> {
        const items = await this.getAll(user, excludeControlUser, 
            {
                onlyPenAndGen: false,
                destino: [],
                filter,
                includeInfoProductos: false
            }
        );
        return toArray(items);
    }

    private getFilters(
        includeTargets: boolean, 
        origenids: string[], 
        destinosids: string[], 
        planid?: string, 
        filter?: any, 
        onlyPenAndGen?: boolean
    ) {
        if (!filter) filter = {};
        if (!onlyPenAndGen) {
            filter.estado = {$nin: [OrdenTransporteEstadoEnum.EnEdicion]}
        } else {
            filter.estado = {$in: [OrdenTransporteEstadoEnum.Pendiente, OrdenTransporteEstadoEnum.Generada]}
        }
        if (planid) filter["planid"] = planid;

        if (origenids.length > 0) {
            // Si tiene permiso a ver las OEs cuyo destino es uno de mis orgienes, se aplica filtro de origen tambien al campo destinoid
            if (includeTargets) {
                filter["$or"] = [
                    {'origenid' : {$in : origenids}},
                    {'destinoid' : {$in : origenids}}
                ];
            } else {
                filter["origenid"] = {$in : origenids};
            }
        }
        
        if (destinosids.length > 0) {
            filter["destinoid"] = { $in: destinosids };
        }

        return filter;
    }

    async getAll(user: JwtPayload, excludeControlUser: boolean, params: {onlyPenAndGen?: boolean, planid?: string, regionid?: string, origen?: string, destino?: string[], filter?: any, includestock?: boolean, includeInfoProductos?: boolean, includeTruckCode?: boolean}): Promise<OrdenTransporteVM[]> {
        const userInfo = await this.userConfigService.get(user.userId);
        const includeAll = this.permissionOk(user, 'include-all');
        const includeTargets = this.permissionOk(user, 'include-target');
        const origenids: string[] = [];
        const destinosids: string[] = [];
        
        // Si tiene permiso a ver todas las OEs, no se aplica filtro de origen
        if (!excludeControlUser) {
            if (!includeAll) {
                origenids.push(...userInfo.origenesid);
                if (params.origen) {
                    origenids.push(params.origen)
                }
            }

            const ctargets = params.regionid ? await this.targets(user.userId, params.regionid) : [];
            if (toArray(ctargets).length > 0) {
                if (destinosids.some(i => !ctargets.some(t => t.id == i))) return [];
                destinosids.push(...ctargets.map(t => utils.toString(t.id)));
            }
        }

        if (Array.isArray(params.destino)) {
            params.destino.forEach(d => {
                if (destinosids.indexOf(d) < 0) {
                    destinosids.push(d);
                }
            })
        }

        const filter = this.getFilters(includeTargets, origenids, destinosids, params.planid, params.filter, params.onlyPenAndGen);
        const items = await this.findAll(filter);        
        const onlyPenAndGen = utils.toBoolean(params.onlyPenAndGen, items.length == 1); 

        return this.normalize(user, items, userInfo.origenesid, 
            utils.toBoolean(params.includeInfoProductos, onlyPenAndGen), 
            utils.toBoolean(params.includestock, onlyPenAndGen), 
            params.includeTruckCode);
    }

    async sources(_userId?: string): Promise<LugarVM[]> {
        const data = await this.userConfigService.get(_userId);
        const resp: LugarVM[] = [];
        if (Array.isArray(data?.origenesid)) {
            await Promise.all(data.origenesid.map(item => 
                this.userConfigService.getInfoEntity(item)
            ))
            .then((responses: any[]) => {
                resp.push(...responses);
            })
            .catch(utils.errorFn);            
        }
        return resp;
    }

    anull(id: string): Promise<void> { 
        return new Promise (async (resolve, reject) => {
            if (!id) return reject({message: 'No se encontró la orden de entrega'})
            const orden = await this.findById(id)
            if (!orden) return reject({message: 'No se pudo encontrar la orden'})
            if (orden.estado !== OrdenTransporteEstadoEnum.Generada) return reject({message: 'No se puede anular una orden en estado ' + orden.estado});
            if (await this.update(utils.toString(orden.id), {estado: OrdenTransporteEstadoEnum.Anulada, fechaanulacion: formatDate()})) {
                resolve()
            } else reject ({ message: 'No se pudo anular la orden'});
        })
    }

    closewithpendings(id: string): Promise<void> {
        return new Promise (async (resolve, reject) => {
            if (!id) return reject({message: 'No se encontró la orden de entrega'})
            const orden = await this.findById(id)
            if (!orden) return reject({message: 'No se pudo encontrar la orden'})
            if (orden.estado !== OrdenTransporteEstadoEnum.Pendiente) return reject({message: 'No se puede anular una orden en estado ' + orden.estado});
            if (await this.update(utils.toString(orden.id), {estado: OrdenTransporteEstadoEnum.CerradaConPendiente, fechacierre: formatDate()})) {
                resolve()
            } else reject ({ message: 'No se pudo anular la orden'});
        })
    }

    updateorder(id: string, body: OTUpdateBody): Promise<any> {
        return new Promise(async (resolve, rejects) => {
            try {
                if (!id || id == '' || !Array.isArray(body.productos) || (body.productos.length == 0 && !body.fechaproveedor)) return rejects({message: 'Verifique los parametros enviados.'});
                // Obtenemos la orden
                const ordentransporte = await this.findById(id);
                if (!ordentransporte) return rejects({message: 'Error al obtener la orden.'});

                // Actualizamos las cantidadestotales
                for (const item of body.productos) {
                    const productIndex = ordentransporte.productos.findIndex(prod => prod.productoid == item.productoid);
                    if (productIndex < 0) return rejects({message: 'Error al obtener producto en la orden.'});
                    if (item.deleted) ordentransporte.productos.splice(productIndex, 1);
                    else {
                        if (item.newCantidades <= 0) return rejects({message: 'No pueden incluir una cantidad menor que cero.'});
                        const diffTotal = item.newCantidades - ordentransporte.productos[productIndex].cantidadtotal;
                        ordentransporte.productos[productIndex].cantidadtotal = item.newCantidades;
                        ordentransporte.productos[productIndex].cantidaddisponible = ordentransporte.productos[productIndex].cantidaddisponible + diffTotal;
                        if (ordentransporte.productos[productIndex].cantidaddisponible < 0) {
                            return rejects({message: 'La cantidad ingresada es invalida, se han utilizado mas materiales que el total asignado.'});
                        }
                    }
                }
                if (body.fechaproveedor) {
                    const prioridad = await this.prioridadService.findById(ordentransporte.prioridadid)
                    ordentransporte.fechaproveedor = body.fechaproveedor;
                    ordentransporte.fechaestimada = this.getEstimatedDate(body.fechaproveedor, utils.parseNumber(prioridad?.days))
                }
                // Actualizamos los productos de la orden en la db
                this.update(id, {productos: ordentransporte.productos, fechaestimada: ordentransporte.fechaestimada, fechaproveedor: ordentransporte.fechaproveedor});
                return resolve({message: "Orden actualizada exitosamente."});
            } catch (error: any) { 
                return rejects({ message: error?.message || "Error desconocido" });
            }
        })
    }

    async sendNotification(
        user: JwtPayload,
        items: OrdenTransporte[], 
    ): Promise<string> {
        
        const key = NotificationType.LG_GENERACION_OE;

        if (toArray(items).length == 0) return "Invalid request.";
                
        const origenIds = new ArrayList();
        const destinoIds = new ArrayList();
        const usernames = new ArrayList();
        items.forEach(item => {
            origenIds.push(item.origenid);
            destinoIds.push(item.destinoid);
            usernames.push(item.usuario);        
        });
        
        const usersTMO: UserInfo[] = [];
        const usersLgO: UserInfo[] = [];
        const usersLgD: UserInfo[] = [];
        const ordenesTransporteVM: OrdenTransporteVM[] = [];
        
        await Promise.all([
            this.userConfigService.getUsersFromRoles(origenIds.get(), "logistica"),
            this.userConfigService.getUsersFromRoles(destinoIds.get(), "logistica"),
            this.normalize(user, items, [], true, false, false),
            this.userConfigService.getUsersFromRoles(origenIds.get(), "tm"),
        ]) 
        .then(responses => {
            usersLgO.push(...responses[0]);
            usersLgD.push(...responses[1]);
            ordenesTransporteVM.push(...responses[2]);
            usersTMO.push(...responses[3]);            
        })
        .catch(utils.errorFn)

        const array: {orden: OrdenTransporteVM, html: string | void}[] = [];
        if (ordenesTransporteVM.length > 0) {
            let index = 0;
            for (const item of ordenesTransporteVM) {
                index += 1;
                const html = await this.notificationConfigService.notificationService.getHTML({
                    key, 
                    info: [
                        {
                            name: 'fecha', 
                            value: utils.formatVisibledDate(item.createdAt)
                        },{
                            name: 'usuario', 
                            value: '[USUARIO]',
                        },{
                            name: 'fechaplanificada', 
                            value: utils.formatVisibledDate(item.fechaestimada)
                        },{
                            name: 'multiple',
                            value: ordenesTransporteVM.length > 1 ? 'flex' : 'none'
                        },{
                            name: 'simple',
                            value: ordenesTransporteVM.length > 1 ? 'none' : 'flex'
                        },{
                            name: 'numberid', 
                            value: this.padLeadingZeros(item.puntoventa, 4) + '-' + this.padLeadingZeros(item.numberid, 8)
                        },{
                            name: 'prioridad', 
                            value: toString(item.prioridad?.name),
                        },{
                            name: 'plan', 
                            value: utils.toString(item.plan?.name),
                        },{
                            name: 'origen', 
                            value: utils.toString(item.origen?.name),
                        },{
                            name: 'destino', 
                            value: utils.toString(item.destino?.name),
                        },{
                            name: 'productos',
                            value: item.productos.map(i => ({
                                codmaterial: this.palletService.productService.getProductCode(i.producto),
                                descripcion: utils.toString(i.producto?.name),
                                cantidad: i.cantidadtotal,
                                cantidaddisponible: i.cantidaddisponible,
                                codigosap: utils.toString(i.producto?.codigosap),
                                codigotruck: utils.toString(i.producto?.codigotruck),
                            }))
                        },{
                            name: 'link',
                            value: `[URL]/delivery/detail-view/${item.id}/[TOKEN]`
                        },{
                            name: 'usuariodisplay',
                            value: index == 1 ? 'flex' : 'none'
                        },{
                            name: 'footerdisplay',
                            value: index == ordenesTransporteVM.length ? 'block' : 'none'
                        },{
                            name: 'linkdisplay', 
                            value: '[LINKDISPLAY]',
                        }
                    ],
                }).catch(utils.errorFn);

                array.push({
                    orden: item,
                    html: html
                });
            }
            const sendedUsers: UserInfo[] = [];
            
            const send = (userl: UserInfo, ordenes: string, token: string, display: string) => {
                if (!ordenes || sendedUsers.some(i => i.email == userl.email)) return;
                sendedUsers.push(userl);
                this.notificationConfigService.send({
                    key,
                    info: [{
                        name: 'subject', 
                        value: ordenesTransporteVM.length > 1 ? 'Nuevas órdenes de entrega' : 'Nueva orden de entrega'
                    }],
                    rawHTML: replaceAll(
                                replaceAll(
                                    replaceAll(ordenes, "[USUARIO]", userl.firstName + ' ' + userl.lastName), 
                                '[TOKEN]', token), 
                            '[LINKDISPLAY]', display),
                    target: [{
                        email: userl.email,
                        name: userl.firstName + ' ' + userl.lastName,
                    }]
                });
            }
            
            // Notificamos a los usuarios de logistica que se genero la OT si el origen de la misma esta dentro de los origenes del usuario
            for (const userl of usersLgO) {
                const ordenes = array.filter(item => userl.config?.origenesid.includes(utils.toString(item.orden.origen?.id))).map(i => i.html).join("");
                const token = await this.notificationConfigService.getUserToken(userl.email);
                send(userl, ordenes, token, 'block');
            }
            
            // Notificamos a los usuarios de logistica que se genero la OT si el destino de la misma esta dentro de los origenes del usuario
            for (const userd of usersLgD) {
                const ordenes = array.filter(item => userd.config?.origenesid.includes(utils.toString(item.orden.destino?.id))).map(i => i.html).join("");
                send(userd, ordenes, "", "none");
            }

            // Notificamos a los usuarios con rol TM_GES y TM_OPER que se genero la OT si el origen de la misma esta dentro de los origenes del usuario
            for (const userd of usersTMO) {
                const ordenes = array.filter(item => userd.config?.origenesid.includes(utils.toString(item.orden.origen?.id))).map(i => i.html).join("");
                const token = await this.notificationConfigService.getUserToken(userd.email);
                send(userd, ordenes, token, 'block');
            }
        }
        return "";
    }

    padLeadingZeros(num?: string, size: number = 8): string {
        return utils.padLeadingZeros(num, size);
    }

    addProductos(id: string, body: OTUpdateBodyProducts[]): Promise<any> {
        return new Promise(async (resolve, rejects) => {
            try {
                if (!id || id == '' || !Array.isArray(body) || body.length == 0) return rejects({message: 'Verifique los parametros enviados.'});
                // Obtenemos la orden
                const ordentransporte = await this.findById(id);
                if (!ordentransporte) return rejects({message: 'Error al obtener la orden.'});
                if(ordentransporte.estado !== OrdenTransporteEstadoEnum.Generada) return rejects({message: 'Esta orden NO puede ser modificada.'});
                for (let i = 0; i < body.length; i++) {
                    if(ordentransporte.productos.some(item => item.productoid === body[i].productoid)) return rejects({message: 'El producto indicado ya existe en la orden.'});
                    if(body[i].newCantidades <= 0) return rejects({message: 'Todas las cantidades ingresadas deben ser mayor a cero.'});
                    ordentransporte.productos.push({
                        productoid: body[i].productoid,
                        cantidadtotal: body[i].newCantidades,
                        cantidaddisponible: body[i].newCantidades,
                    });
                }
                // Actualizamos los productos de la orden en la db
                this.update(id, {productos: ordentransporte.productos});
                return resolve({message: "Orden actualizada exitosamente."});
            } catch (error: any) { 
                return rejects({ message: error?.message || "Error desconocido" });
            }
        })
    }

    private getEstimatedDate(from: string, days: number = 0, fholidays: string[] = [], utc: boolean = false, separator: '/' | '-' = '-'): string {
        const formatDateExcludeTime = (date: Date) => {
            return utils.formatDate(date, 0, false, separator).split(' ')[0];
        }
        if (from && from.length === 10) from = `${from}T00:00:00`;
        
        const ESTIMATED_DATE_DAYS = this.parseNumber(configurationGet(Configuration.ESTIMATED_DATE_DAYS));
        const HOLIDAYS = configurationGet(Configuration.HOLIDAYS);

        days = this.parseNumber(days, ESTIMATED_DATE_DAYS || 0);
        if (fholidays.length == 0 && HOLIDAYS) {
            fholidays = HOLIDAYS.split(',');
        }
        const holidays = fholidays.map(i => formatDateExcludeTime(new Date(i)));

        const estimateddate = new Date(from);
        const getEstimatedDays = (initday: number): number => {
            const date = new Date();
            date.setDate(date.getDate() + initday);
            const eday = date.toString().split(' ')[0];

            if (['Sat', 'Sun'].indexOf(eday) >= 0 || holidays.includes(formatDateExcludeTime(date))) {
                days = days + 1;
            }
            if (initday < days) {
                return getEstimatedDays(initday + 1);
            }
            return days
        }

        estimateddate.setDate(estimateddate.getDate() + getEstimatedDays(1));
    
       
        const m = utils.completeText(estimateddate.getMonth() + 1);
        const d = utils.completeText(estimateddate.getDate()); 
        const h = utils.completeText(estimateddate.getHours());
        const M = utils.completeText(estimateddate.getMinutes());
        const y = estimateddate.getFullYear().toString();

        if (separator == "/") {
            return `${d}/${m}/${y} ${h}:${M}`;            
        }
        
        const s = utils.completeText(estimateddate.getSeconds());
        const ml = utils.completeText(estimateddate.getMilliseconds(), 3);
        
        if (utc) {
            return `${y}-${m}-${d}T${h}:${M}:${s}.${ml}+0300`;
        }

        return `${y}-${m}-${d} ${h}:${M}:${s}.${ml}`;
    }

}

export type OTCreateType = 'pending' | 'ready';

export interface DeliveryGenerateTableInfo {
    plan: string,
    cliente: string,
    material: string,
    cantidad: string,
    prioridadid: string,
    fechaproveedor: string,
    nroordencompra: string,
}

export interface OTUpdateBody {
    productos: OTUpdateBodyProducts[],
    fechaproveedor?: string
}
export interface OTUpdateBodyProducts {
    productoid: string;
    newCantidades: number;
    deleted?: boolean;
    nroordencompra: string;
}

interface ProductosOrigenOUT {
    idorigen: string, 
    productos: ProductDTO[]
}
