import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { BaseFullService, configurationGet, DBName, defaultToken, formatDate, JwtPayload, testIsRunning, toArray } from '@proguidemc/http-module';
import { BodyRequestNotification } from '@proguidemc/notification-module/lib/notification.interfaces';
import { NotificationService } from '@proguidemc/notification-module/lib/notification.service';
import { Cart } from '../../carrito/model/cart.model';
import { Product } from '../../producto/model/producto.model';
import { Configuration } from '../configuration/configuration.enum';
import { LocalidadVM } from '../localidad/model/localidad.model';
import { LugarService } from '../lugar/lugar.service';
import { Lugar, LugarVM } from '../lugar/model/lugar.model';
import { Proveedor } from '../proveedor/model/proveedor.model';
import { Provincia } from '../provincia/model/provincia.model';
import { Region } from '../region/model/region.model';
import { errorFn, formatVisibledDate, padLeadingZeros, toString } from '../utils/utils';
import { Tokens, UserConfig, UserInfo } from './model/userconfig.model';

const mockTokens: Tokens[] = [{
    _id: "none", 
    id: "none", 
    username: "mborgo", 
    email: "mborgo@proguidemc.com",  
    token: "test", 
    expiration: "48h"
}];

const mockUsers: UserInfo[] = [
    {
        id: "601803a13db4900043735668",
        username: "mborgo", 
        email: "mborgo@proguidemc.com", 
        groups: ["none"], 
        groupsNames: [{
            id: "none",
            name: "test"
        }],
        firstName: "test",
        lastName: "test",
    }
];

const mockUserGroups: GroupInfo[] = [{
    id: "none", 
    _id: "none", 
    name: "test", 
    commonName: "test",
    company: "none"
}];

@Injectable()
export class UserConfigService extends BaseFullService<UserConfig> {
    
    constructor(
        protected httpService: HttpService,
        public lugarService: LugarService,
        public notificationService: NotificationService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'userconfig'}, httpService);
    }

    private configTableUser() {
        return {dbname: DBName.UserManager, tablename: 'users'};
    }

    findUsers(filter: any): Promise<UserInfo[]> {
        return this.findAllFlex(this.configTableUser(), filter, mockUsers); 
    }

    async getUserInfo(userId: string, username?: string): Promise<UserInfo | undefined> {
        const user = username ?
            await this.findOneFlex(this.configTableUser(), {username}, mockUsers)
        :
            await this.findByIdFlex(this.configTableUser(), userId, mockUsers);

        if (Array.isArray(user?.groups)) {
            return {
                ...user,
                groupsNames: await this.findAllFlex({dbname: 'UserManager', tablename: 'groups'}, {_id: {"$in": user.groups}}, mockUserGroups)
            }    
        }
        return undefined;
    }

    private WEB_URL = "";
    private UM_HOST_PORT = "";
    private DEFAULTROLID = "";
    private EXPIRATION = "";

    webUrl() {
        this.WEB_URL = configurationGet(Configuration.WEB_URL);
        if (!this.WEB_URL || this.WEB_URL.length < 5) this.WEB_URL = '';
        return this.WEB_URL;
    }

    tokenEnabled(): boolean {
        this.EXPIRATION = configurationGet(Configuration.EXPIRATION);
        if (!this.EXPIRATION || this.EXPIRATION.length < 2) this.EXPIRATION = '1h';
                
        this.webUrl();

        this.UM_HOST_PORT = configurationGet(Configuration.UM_HOST_PORT);
        if (!this.UM_HOST_PORT || this.UM_HOST_PORT.length < 5) this.UM_HOST_PORT = '';

        this.DEFAULTROLID = configurationGet(Configuration.DEFAULTROLID);
        if (!this.DEFAULTROLID || this.DEFAULTROLID.length < 5) this.DEFAULTROLID = '';
        
        if (this.WEB_URL == '' || this.UM_HOST_PORT == '' || this.DEFAULTROLID == '') return false;
        
        return true;        
    }
        
    private getTokenTableInfo() {
        return {
            dbname: DBName.ShoppingManager, 
            tablename: "tokens"
        };
    }

    private async generateKeyToken(username: string, email: string, token: string, expiration: string) {
        const info: Tokens = await this.createFlex(this.getTokenTableInfo(), {
            username, 
            email, 
            token,
            expiration
        }, mockTokens);

        return toString(info?._id);
    }
    
    async getKeyToken(_key: string): Promise<{user: JwtPayload, token: string} | undefined> {

        const info: Tokens = await this.findByIdFlex(this.getTokenTableInfo(), _key, mockTokens);
        const userInfo = info?.username ? await this.getUserInfo(info.username, info.username) : undefined;
        if (!userInfo?.id) return undefined;

        const user = new JwtPayload();
        user.roles = [];
        user.userId = userInfo.id;
        user.username = userInfo.username;

        return {
            user,
            token: info.token
        };
    }

    async manageKeyToken(timeout?: number) {        
        setTimeout(async () => {
            const filter = {
                createdAt: {$lt: new Date(formatDate(undefined, -30, false, "-"))}
            };
            await this.deleteManyFlex(this.getTokenTableInfo(), filter, mockTokens);
            if (!testIsRunning()) this.manageKeyToken(360000);
        }, timeout);
        return;
    }

    async getUserToken(username: string, email: string):Promise<string> {
        if (!this.tokenEnabled()) return "";
      
        const url = `${this.UM_HOST_PORT}/user/generate-token/${this.DEFAULTROLID}/${username}/${email}/${this.EXPIRATION}`;
        const resp = await this.httpget(
            url,
            {
                headers: {
                    authorization: 'bearer ' + defaultToken()
                }                
            }
        ).catch(error => console.error("getUserToken", error));

        const token = toString(resp?.token);

        if (token == '') {
            this.errorLog("getUserToken", {url, username, email, error: 'No se pudo obtener el token de envio de link'})
        }

        return await this.generateKeyToken(username, email, token, this.EXPIRATION);
    }

    async getLinkTask(username: string, email: string, endpoint: string): Promise<string> {
        const token = await this.getUserToken(username, email);
        if (!token || token == '') return '';
        return `${this.WEB_URL}/${endpoint}/${token}`;        
    }

    getInfoEntitiesForRegion(regionid: string): Promise<LugarVM[]> {
        return this.getInfoEntities([], {regionid});
    }

    async getTargetsForUser(userId?: string): Promise<LugarVM[]> {
        const config = await this.get(userId);
        if (toArray(config.origenesid).length > 0) {
            const origenes = await this.lugarService.findAll({id: {$in: config.origenesid}, recibede: {$exists: true}});
            const ids: string[] = [...config.origenesid];
            origenes.forEach(item => {
                ids.push(...toArray(item.recibede));
            });
            const array = Array.from(new Set(ids));
            const items = await this.getInfoEntities([], {id: {$in: array}});
            return items;
        }
        return [];
    }

    getInfoEntitiesForRecibede(recibede: string[]): Promise<LugarVM[]> {
        return this.getInfoEntities([], {recibede: {$in: recibede}});
    }

    async get(userid?: string): Promise<UserConfig> {
        if (userid) {
            const item = await this.findOne({userid}).catch(errorFn);
            if (item && Array.isArray(item.origenesid)) return item;
            if (userid != 'default') return this.get('default'); // Se puede configurar en la DB un userid default para q todos los usuarios q no tengan configuracion asignada, utilicen esta.
        }
        
        return {
            destinosid: [],
            origenesid: [],
            userid: toString(userid),
        };
    }

    async allSources(origenes: string[]): Promise<LugarVM[]> {
        return this.getInfoEntities(origenes);
    }

    async getInfoEntity(id: string): Promise<LugarVM | undefined> {
        const lugar = await this.lugarService.findById(id);
        const items = lugar ? await this.completeInfo([lugar]) : [];
        if (items.length > 0) return items[0];
        return undefined;        
    }

    private completeInfo(values: Lugar[]): Promise<LugarVM[]> {
        return new Promise(async resolve => {
            const types = await this.lugarService.lugarTipoService.findAll({});
            const items: LugarVM[] = [];
            const regionIds: string[] = [];
            const localidadIds: string[] = [];
            
            values.forEach(item => {
                if (item.regionid && regionIds.indexOf(item.regionid) < 0) {
                    regionIds.push(item.regionid);
                }
                if (item.localidadid && localidadIds.indexOf(item.localidadid) < 0) {
                    localidadIds.push(item.localidadid);
                }
            });

            const regiones: Region[] = [];
            const localidades: LocalidadVM[] = [];
            const provincias: Provincia[] = [];
            
            await Promise.all([
                this.findAllFlex(
                    {dbname: DBName.ShoppingManager, tablename: 'region'}, 
                    {id: {$in: regionIds}}
                ),
                this.findAllFlex(
                    {dbname: DBName.ShoppingManager, tablename: 'localidad'}, 
                    {id: {$in: localidadIds}}
                ),
                this.findAllFlex(
                    {dbname: DBName.ShoppingManager, tablename: 'provincia'}, 
                    {}
                )
            ])
            .then(responses => {
                regiones.push(...responses[0]);
                localidades.push(...responses[1]);
                provincias.push(...responses[2]);
            })
            .catch(errorFn)
            
            localidades.forEach(i => {
                if (i.provinciaid) {
                    i.provincia = provincias.find(j => j.id == i.provinciaid);
                }
            });

            values.forEach(item => {
                items.push({
                    ...item,
                    tipo: types.find(i => i.id == item.tipo),
                    regionnombre: toString(regiones.find(i => i.id == item.regionid)?.name),
                    regionabreviatura: toString(regiones.find(i => i.id == item.regionid)?.abreviatura),
                    localidad: item.localidadid ? localidades.find(i => i.id == item.localidadid) : undefined,
                });
            });
            
            resolve(items);
        })
    }

    async getInfoEntities(filter: string[], customFilter: any = null): Promise<LugarVM[]> {
        return new Promise(async resolve => {
            if (!customFilter && (!Array.isArray(filter) || filter.length == 0)) return resolve([]);
            if (!customFilter) customFilter = {id: {$in: filter}};
            const items = await this.lugarService.findAll(customFilter);
            const resp = await this.completeInfo(items);
            resolve(resp);
        });
    }

    private async getFilteredUsers(lugaresid: string[]) {
        const userConfig = await this.findAll({});
        const userids: string[] = [];
        
        if (Array.isArray(userConfig)) {
            userConfig.forEach(item => {
                if (item.origenesid.some(i => lugaresid.indexOf(i) >= 0) && userids.indexOf(item.userid) < 0) {
                    userids.push(item.userid);
                }                
            })
        }

        return {
            userConfig,
            userids
        };
    }

    async getUsersFromRoles(lugaresid: string[], groups: "logistica" | "tm"): Promise<UserInfo[]> {
        const info = await this.getFilteredUsers(lugaresid);        
        let roles: string[] = [];

        switch (groups) {
            case 'logistica':
                roles = configurationGet(Configuration.ROLES_LO).split(",");
                break;
            case 'tm':
                roles = configurationGet(Configuration.ROLES_TM).split(",");
                break;
        }
        
        if (info.userids.length == 0) return [];

        const users = await this.findUsers({_id: {$in: info.userConfig.map(i => i.userid)}, userRoles: {$in: roles}});
        return users.map(item => {
            item.config = info.userConfig.find(i => i.userid == item.id);
            return item;
        });    
    }

    private async send(body: BodyRequestNotification): Promise<string> {
        let errorSend: any = null;
        const resp = await this.notificationService.send(body).catch(e => errorSend = e);
    
        if (errorSend) {
          this.errorLog("send", {body, errorSend});
          return errorSend.message || 'No se pudo enviar la notificacion';
        }
    
        if (!resp || resp.message) {
          this.errorLog("send", {body, resp});
          return !resp ? 'No se obtuvo respuesta del servicio de notificaciones' : resp.message || 'No se pudo comprobar el envio de la notificacion';
        }
    
        return "";
      }
    
    private async bodyNotificacionProveedores(key: NotificationType, info: any, ): Promise<BodyRequestNotification> {
        const body: BodyRequestNotification = {
            key,
            info: [],
            target: [],
        };

        if (!info?.cart || !Array.isArray(info?.users) || info?.users.length == 0 || !info?.userInfo) return body;
        const link = key == NotificationType.TM_PROVEEDORES_GANADORES ? 
                        `quotation/${info.cart.id}/purchaseorders/external` : 
                        `quotation/${info.cart.id}/choose/external`;

        for (const [keyItem] of Object.entries(info.cart)) {
            if (keyItem == 'productos') continue;
            let value = info.cart[keyItem];

            switch (keyItem.toLowerCase()) {
                case 'createdat':
                case 'updatedat':
                    value = formatVisibledDate(value);
                    break;
                case 'numberid':
                    value = padLeadingZeros(value, 4);
                    break;
            }

            body.info.push({
                name: keyItem,
                value
            });
        }

        body.info.push({
            name: 'email',
            value: info.userInfo.firstName + ' ' + info.userInfo.lastName,
        });

        body.info.push({
            name: 'link',
            value: ''
        });

        const promises = [];

        for (const item of info.users) {
            if (!item.email || item.email == '') continue;
            
            body.info[body.info.length - 1].value = await this.getLinkTask(item.username, item.email, link);
            if (!body.info[body.info.length - 1].value || body.info[body.info.length - 1].value == '') continue;
            
            body.target = [
                {
                    name: item.firstName + ' ' + item.lastName,
                    email: item.email,
                }
            ];
            
            promises.push(this.send(body));
        }
        await Promise.all(promises).catch(errorFn);

        body.info = [];
        return body;
    }

    private async bodyNotificacionProveedoresEnvio(key: NotificationType, proveedor?: Proveedor, fixedData?: NotificationInfoCart): Promise<BodyRequestNotification> {
        const body: BodyRequestNotification = {
            key,
            info: [],
            target: [],
        };
        const cartId = fixedData?.id;        
        if(!proveedor?.emailc || !proveedor?.name || !cartId) return body; 
        
        const products: NotificationInfoProduct[] = [];
        if (Array.isArray(fixedData?.products)) {
            products.push(...fixedData?.products.map(item => {
                return {
                    producto: !item.producto ? "" : (item.producto.name+' - '+item.producto.nomenclatura),
                    cantidad: item.cantidad,
                }
            }));
        }

        if (products.length == 0) return body;
        
        body.target.push({
            name: proveedor.name,
            email: proveedor.emailc,
        });
        
        body.info.push({
            name: 'proveedor',
            value: proveedor.name
        });

        body.info.push({
            name: 'productos',
            value: products
        });

        body.info.push({
            name: 'link',
            value: await this.getLinkTask('guest', proveedor.emailc, `quotation/${cartId}/supplier/${proveedor.id}`)
        });

        return body;
    }

    async sendNotification(key: NotificationType, proveedor?: Proveedor, fixedData?: NotificationInfoCart, info?: {
        cart: Cart, 
        users: UserInfo[],
        userInfo?: UserInfo, 
    }): Promise<string> {
        let body: BodyRequestNotification;

        switch (key) {
            case NotificationType.TM_PROVEEDORES_GANADORES:
            case NotificationType.CO_PROVEEDORES_GANADORES:
                body = await this.bodyNotificacionProveedores(key, info);
                break;
                
            case NotificationType.CO_PROVEEDORES_ENVIO:                    
                body = await this.bodyNotificacionProveedoresEnvio(key, proveedor, fixedData);
                break;
            default: 
                return "";
        }

        if (body.info.length == 0 || body.target.length == 0) return "";
        
        return this.send(body);
    }
}

export enum NotificationType {
    TO_START_DISTRIBUTION = 'compras.distribucion.to.inicio', // Notificacion que se envia a todos los responsables de regiones, cuando tiene disponible una propuesta de distribucion 
    TO_REVIEW_DISTRIBUTION = 'compras.distribucion.to.revision', // Notificacion que se envia al responsable del TO, cuando tiene que revisar una propuesta
    TO_REVIEW_DISTRIBUTION_OK = 'compras.distribucion.to.revision.ok', // Notificacion que se envia al responsable del TO, cuando se aprobo la propuesta
    TM_DISTRIBUTION = 'compras.distribucion.tm',                // Notificacion que se envia al responsable de TM, cuando un TO devolvio una propuesta completada
    CO_PROVEEDORES_ENVIO = 'compras.cotizacion.envio', // Notificacion que se envia a los proveedores para cotizar los materiales
    CO_PROVEEDORES_RECEPCION = 'compras.cotizacion.recepcion', // Notificacion que recibe compras cuando un proveedor les respondio la cotizacion      
    CO_PROVEEDORES_GANADORES = 'compras.proveedores.ganadores', // Notificacion que recibe tm cuando compras propone proveedores ganadores
    TM_PROVEEDORES_GANADORES = 'compras.proveedores.respuesta', // Notificacion que recibe COMPRAS cuando TM elige los proveedores ganadores
    LG_GENERACION_OE = 'logistica.ordentransporte.generacion', // Notificacion que se envia a los mails de los destinos y origenes de una OE cuando esta es generada
    LG_GENERACION_PR = 'logistica.planillarecepcion.generacion', // Notificacion que se envia a los usuarios de logistica de los destinos de la planilla de despacho cuando esta es despachada, es decir a los origenes de las planillas de recepcion
    LG_RECEPCION_PR = 'logistica.planillarecepcion.recepcion', // Notificacion que se envia a los usuarios de logistica del origen de la planilla de recepcion cuando esta es recibida
}

interface NotificationInfoCart {
    id: string;
    products: NotificationInfoFullProduct[];
}

interface NotificationInfoFullProduct {
    producto?: Product;
    cantidad: number;
}

export interface NotificationInfoSupplier {
    supplier: Proveedor;
    products: NotificationInfoFullProduct[];
}

export interface NotificationInfoProduct {
    producto: string;
    cantidad: number;
}

export interface GroupInfo {
    _id : string,
    id: string,
    name : string,
    company : string,
    commonName :string,    
}