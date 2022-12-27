import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { carritoDeleteEnabled, carritoRequireProcess, Cart, CartAction, CartType, CartVM, DistribucionDestino, DistribucionInfo, DistribucionInfoDTO, DistribucionItem, DistribucionItemEstado, getDestinos, ProductArt, Quotation, QuotationCounter, QuotationProduct, QuotationSuppliers, QuotationTotal, RegionCount, Supplier, SupplierEstado, SuppliersTotal } from './model/cart.model';
import { BaseFullService, configurationGet, DBName, JwtPayload } from '@proguidemc/http-module';
import { Configuration } from '../shared/configuration/configuration.enum';

import { ProductService } from '../producto/producto.service';
import { EstrategiaService } from '../shared/estrategia/estrategia.service';
import { DistributionDTO, Product, ProductDistributionDTO, ProductState } from '../producto/model/producto.model';
import { DistribucionEstado } from '../shared/estadodistribucion/model/estadodistribucion.model';
import { RegionService } from '../shared/region/region.service';
import { AppModule } from '../app.module';
import { Proveedor } from '../shared/proveedor/model/proveedor.model';
import { CarritomovService } from '../carritomov/carritomov.service';
import { Carritomov } from '../carritomov/model/carritomov.model';
import { CarritoEstadoService } from './carritoestado.service';
import { CarritoEstado, CarritoEstadoEnum } from './model/carritoestado.model';
import { ArrayList, convertImages, errorFn, formatDate, formatVisibledDate, nextStatusIsValid, padLeadingZeros, replaceAll, toArray, toString } from '../shared/utils/utils';
import { PlanService } from '../shared/plan/plan.service';
import { Plan } from '../shared/plan/model/plan.model';
import { NotificationInfoSupplier, NotificationType } from '../shared/userconfig/userconfig.service';
import { OrdenCompraVM } from '../ordencompra/model/ordencompra.model';
import { OrdenCompraEstadoEnum } from '../ordencompra/model/ordencompraestado.model';
import { UserInfo } from '../shared/userconfig/model/userconfig.model';

@Injectable()
export class CartService extends BaseFullService<Cart> {
  
    constructor(
        public productService: ProductService,
        public regionService: RegionService,        
        public carritoEstadoService: CarritoEstadoService,
        public estrategiaService: EstrategiaService,
        public carritoMovService: CarritomovService,
        public planService: PlanService,
        protected httpService: HttpService,       
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'carrito'}, httpService);
    }

    async getDueDate(_carrito: Cart): Promise<{date: string, time: string}> {
        
        const hours = 72;
        const date = formatVisibledDate("", true, false, Math.round(hours / 24) );
        return {
            date: date.substring(0, 10),
            time: date.substring(date.length - 5, 5),
        }
    }

    private async getDashboardConfig(): Promise<ConfigInfo> {
        const config = await this.findOneFlex({dbname: "UserManager", tablename: "configs"}, {name: 'dashboard'});
        return config?.value;
    }

    private normalizeCart(cart: Cart, estados: CarritoEstado[], planes?: Plan[]): CartVM | undefined {
        cart.productos = toArray(cart.productos);
        // Normalizar campos para el front end
        cart.numberid = padLeadingZeros(cart.numberid, 4);
        cart.productos.forEach(item => {
            if (Array.isArray(item.arts)) {
                item.arts.forEach(i => {
                    i.archivo = i.archivo.replace("{app}", AppModule.URL);
                });
            }
        });

        // Condicion para que un carrito pueda ser enviado a los TOs
        const productoAceptado = (item: DistribucionInfo): boolean => {
            return Array.isArray(item.items) && !item.items.some(i => i.estado !== DistribucionEstado.Aceptada);
        }

        // Condicion para que un carrito pueda ser enviado a compras. Todas las regiones o paises del carrito, deben tener todos los productos aceptados
        const propuestaAptaParaEnvioACompras = 
            cart.estado === CarritoEstadoEnum.PreparacionEnPlanificacion && 
            cart.productos.filter(i => !productoAceptado(i)).length === 0;
        
        // Condicion para que un carrito pueda ser enviado a los TOs. Debe ser estrategia REGION, debe tener al menos un producto, y todos los 
        // productos deben tener al menos una region con cantidad propuesta mayor a cero
        const productoCompletado = (item: DistribucionInfo): boolean => {
            return Array.isArray(item.items) && item.items.some(i => i.cantidadpropuesta > 0);
        }

        const propuestaAptaParaEnvioATOs = 
            cart.estado === CarritoEstadoEnum.PreparacionEnPreparacion && 
            carritoRequireProcess(cart) && 
            cart.productos.filter(i => !productoCompletado(i)).length === 0;
        
        const envioAComprasPorEstrategia = 
            cart.estado === CarritoEstadoEnum.PreparacionEnPreparacion && 
            (!carritoRequireProcess(cart)) && 
            cart.productos.filter(i => 
                Array.isArray(i.items) && 
                i.items.find(j => this.parseNumber(j.cantidadpropuesta) > 0)
            ).length == cart.productos.length;
        
        if (Array.isArray(planes)) {
            const plan = planes.find(p => p.id == cart.plan);
            if (plan) cart.plan = plan.name;
        }
        
        return {
            ...cart,
            estadonombre: toString(estados.find(i => i.id == cart.estado)?.name),
            regional: carritoRequireProcess(cart),
            enabledDelete: carritoDeleteEnabled(cart),
            action: envioAComprasPorEstrategia ? 'sendto-shop' : 
                    propuestaAptaParaEnvioATOs ? 'sendto-to' : 
                    propuestaAptaParaEnvioACompras ? 'sendto-shop' : 
                    undefined,
        };
    }

    private async getSuppliers(productos: DistribucionInfo[], productId?: string): Promise<Proveedor[]> {
        const provIds: any[] = [];

        for (const item of productos) {
            if (productId && item.id != productId) continue;
            if (Array.isArray(item.proveedores) && item.proveedores.length > 0) {
                item.proveedores.forEach(i => {
                    if (provIds.indexOf(i.id) < 0) {
                        provIds.push(i.id);
                    }
                });
            }
        }
        
        if (provIds.length > 0) {
            return this.regionService.proveedorService.findAll({_id: {$in: provIds}});
        }

        return [];
    }

    private sumCounts(items?: DistribucionItem[]): number {
        let resp = 0;
        for (const item of toArray(items)) {
            resp = resp + item.cantidadpropuesta; // item.cantidadsolicitada
        }
    
        return resp;
    }

    private async defineDetail(cart: Cart, suppliers: QuotationSuppliers[], productos: QuotationProduct[], productId?: string) {
        const productosInfo = await this.productService.findAllConvert({_id: {$in: cart.productos.map(i => i.id)}});
        const datosProveedores: Proveedor[] = await this.getSuppliers(cart.productos, productId);   
        cart.productos.forEach(item => {
            const totalesProveedores: QuotationTotal = {
                total: toArray(item.proveedores).length,
                cotizados: toArray(item.proveedores).filter(i => i.estado != SupplierEstado.Pendiente).length,
            };
                    
            const normalizedProveedores: Supplier[] = [];

            const proveedores = toArray(item.proveedores);
            if (datosProveedores.length > 0) {
                proveedores.forEach(sup => {
                    const proveedor = datosProveedores.find((elm) => elm.id == sup.id);
                    if (proveedor) {                    
                        let index = suppliers.findIndex(it => it.id == sup.id);
                        if (index < 0) {
                            index = suppliers.length;
                            suppliers.push({
                                ...proveedor,
                                counters: [
                                    {
                                        id: SupplierEstado.Pendiente,
                                        name: 'Materiales pendientes de envío',
                                        color: 'red',
                                        count: 0
                                    },{
                                        id: SupplierEstado.Enviada,
                                        name: 'Materiales enviados a cotizar',
                                        color: 'blue',
                                        count: 0
                                    },{
                                        id: SupplierEstado.Recibida,
                                        name: 'Materiales cotizados recibidos',
                                        color: 'green',
                                        count: 0
                                    },
                                ]
                            });
                        }

                        const subindex = suppliers[index].counters.findIndex(it => it.id == sup.estado);
                        if (subindex >= 0) {
                            suppliers[index].counters[subindex].count = suppliers[index].counters[subindex].count + 1;
                        }

                        const supplier: Supplier = {
                            id: sup.id,
                            estado: sup.estado,
                            proveedor: proveedor,
                            diasproduccion: sup.diasproduccion,
                            fechacotizacion: sup.fechacotizacion,
                            preciounitario: sup.preciounitario,
                        };
                        
                        normalizedProveedores.push(supplier);
                    }
                });
            }

            let proveedorcompras: { id: string; name: string; } = {id: '', name: ''};
            let proveedortm: { id: string; name: string; } = {id: '', name: ''};

            const proveedorCompasIndex = normalizedProveedores.findIndex(proveedor => proveedor.id == item.proveedoridcompras);
            if (proveedorCompasIndex != -1)
                proveedorcompras = { 
                    id: normalizedProveedores[proveedorCompasIndex]?.id, 
                    name: toString(normalizedProveedores[proveedorCompasIndex]?.proveedor?.name),
                }

            const proveedorTmIndex = normalizedProveedores.findIndex(proveedor => proveedor.id == item.proveedoridtm);
            if (proveedorTmIndex != -1)
                proveedortm = { 
                    id: normalizedProveedores[proveedorTmIndex]?.id, 
                    name: toString(normalizedProveedores[proveedorTmIndex]?.proveedor?.name),
                }
            
            const newItem: QuotationProduct = {
                id: item.id,
                cantidad: this.sumCounts(item.items),
                producto: productosInfo.find(i => i.id == item.id),
                proveedores: normalizedProveedores,
                totales: totalesProveedores,
                proveedorcompras,
                proveedortm,
            }
            productos.push(newItem);
        });
    }

    private async defineCounts(cart: Cart): Promise<SuppliersTotal> {
        let cantTotal = cart.productos.length;
        let cantParcial = 0;

        if (cart.estado == CarritoEstadoEnum.CompraEnEleccionGanadores){
            cantParcial = cart.productos.filter(i => i.proveedoridtm).length;
        }else if(cart.estado == CarritoEstadoEnum.CompraPropuestaProveedor) {
            cantParcial = cart.productos.filter(i => i.proveedoridcompras).length;
        } else if(cart.estado == CarritoEstadoEnum.CompraEnCompra) {
            const ordenes = await this.findAllFlex({dbname: DBName.ShoppingManager, tablename: "ordencompra"}, {carritoid : cart.id});
            cantTotal = ordenes.length;
            cantParcial = ordenes.filter(i => i.estado == OrdenCompraEstadoEnum.Confirmada).length;
        }
    
        return {
            total: cantTotal,
            parcial: cantParcial
        }
    }

    private async normalizeCartCotizaciones(cart: Cart, estados: CarritoEstado[], withDetail: boolean = false, productId?: string): Promise<Quotation> {
        return new Promise(async(resolve) => {
            cart.estrategia = toString((await this.estrategiaService.findOne({id: cart.estrategia}))?.name, cart.estrategia);
            cart.productos = toArray(cart.productos);
            
            const userIds = new ArrayList('all');
            userIds.push(cart.usuario);

            toString(cart.compartidocon).split(",").forEach(item => {
                userIds.push(item);
            })

            const users: UserInfo[] = await this.productService.userConfigService.findUsers({username: {$in: userIds.get()}});
            // Normalizar campo creador para el front end
            const creador = users.find(user => user.username == cart.usuario);
            if (creador) cart.usuario = creador.firstName + " " + creador.lastName;
            const items = toString(cart.compartidocon).split(',');
            const usuarios: any[] = [];
            items.forEach(u => {
                const usuario = users.find(user => user.username == u);
                if (usuario) usuarios.push(usuario.firstName + " " + usuario.lastName);
            });
            cart.compartidocon = usuarios.join(", ");
            
            const cotizaciones: QuotationCounter = { enviadas:0, recibidas: 0 };
            const productos: QuotationProduct[] = [];
            const suppliers: QuotationSuppliers[] = [];
            const totales: QuotationTotal = {
                total: 0,
                cotizados: 0,
            };

            cart.productos.forEach(product => {
                toArray(product.proveedores).forEach(supplier => {
                    if (supplier.estado != SupplierEstado.Pendiente)
                        cotizaciones.enviadas += 1;
                    if (supplier.estado == SupplierEstado.Recibida)
                        cotizaciones.recibidas += 1;
                });
            });

            if (withDetail) {
                await this.defineDetail(cart, suppliers, productos, productId)
            } else {
                totales.total = cart.productos.length;
                totales.cotizados = cart.productos.filter(i => toArray(i.proveedores).find(j => j.estado != SupplierEstado.Pendiente)).length;
            }
            
            const acciones: {
                enviaracotizar?: boolean; //sendenabled
                finalizarcotizacion?: boolean; // finalizedenabled
                proponerproveedores?: boolean; // proposewinersenabled
                solicitargeneracionocs?: boolean; // reqgenerateocs
            } = {};

            acciones.enviaracotizar = productos.some(i => i.totales.total > i.totales.cotizados);
            
            // Si no existen productos o bien, algun producto no tiene proveedores asignados, no deberia mostrar el boton FINALIZAR en frontend
            acciones.solicitargeneracionocs = true;
            acciones.finalizarcotizacion = !cart.productos.some(product => {
                                                const array = toArray(product.proveedores);
                                                return array.length == 0 || array.some(i => i.estado != SupplierEstado.Recibida)
                                            });
            acciones.proponerproveedores = !cart.productos.some(product => {
                return !product.proveedoridcompras || cart.estado == CarritoEstadoEnum.CompraEnEleccionGanadores
            });
            
            const proveedorestotales = await this.defineCounts(cart);
            
            return resolve ({
                ...cart,
                fechaactual: formatDate(undefined, 0, true),
                cotizaciones,
                totales,
                productos,
                suppliers,
                acciones,
                estadonombre: toString(estados.find(i => i.id == cart.estado)?.name),
                proveedorestotales
            });
        
        })
    }

    private async getNameFromService(service: BaseFullService<any>, id: string): Promise<string> {
        if (!id || id == "") return "";
        const item = await service.findOne({id}).catch(errorFn);
        if (item) return item.name;
        return "";
    }

    async getCart(id: string, full: boolean = false, regionId?: string): Promise<CartVM | undefined> {
        return new Promise(async resolve => {
            if (!id) return resolve(undefined);
            const cart = await this.findById(id);
            if (!cart) return resolve(undefined);
            const item = this.normalizeCart(cart, await this.carritoEstadoService.findAll({}), await this.planService.findAll({}));
            if (regionId && item) {
                item.productos = item.productos.filter(i => {
                    return Array.isArray(i.items) && i.items.find(j => j.id == regionId);
                });
            }

            if (item && full) {
                const productos = await this.productService.findAllConvert({_id: {$in: item.productos.map(i => i.id) }}, true, 'none');
                for (const producto of item.productos) {
                    producto.producto = productos.find(i => i.id == producto.id);
                }
            } 
            return resolve(item);
        });
    }

    async getQuotation(cartid: string, productId?: string): Promise<Quotation> {
        return new Promise(async(resolve, reject) => {
            const cart = await this.getCart(cartid);
            if (!cart) return reject({message: "Error al obtener el carrito."});
            return resolve(await this.normalizeCartCotizaciones(cart, await this.carritoEstadoService.findAll({}), true, productId));
        });
    }
    
    async getCarts(type: CartType): Promise<(CartVM | Quotation)[]> {
        return new Promise(async resolve => {
            const carts : (CartVM | Quotation)[] = [];
            const estados = await this.carritoEstadoService.findAll({});
            switch (type) {
                case CartType.Cotizaciones:
                    const itemsEnviados = await this.findAll({ estado: {$in: [
                        CarritoEstadoEnum.CompraEnCompra, 
                        CarritoEstadoEnum.CompraEnCotizacion, 
                        CarritoEstadoEnum.CompraEnEleccionGanadores, 
                        CarritoEstadoEnum.CompraPropuestaProveedor
                    ]} });
                    for (const item of itemsEnviados) {
                        carts.push(await this.normalizeCartCotizaciones(item, estados));
                    }
                    break;            
                default:
                    const itemsPreparacion = await this.findAll({ estado: {$in: [CarritoEstadoEnum.PreparacionEnPreparacion, CarritoEstadoEnum.PreparacionEnPlanificacion]} });
                    const planes = await this.planService.findAll({});
                    itemsPreparacion.forEach(item => {
                        const i = this.normalizeCart(item, estados, planes);
                        if (i) carts.push(i);
                    });
                    break;
            }            
            resolve(carts);
        });
    }

    async instanceCart(cart: Cart, user: string): Promise<CartVM | undefined> {
        return new Promise(async(resolve, reject) => {
            if (cart.fechaesperadacompra) {
                const today = new Date();
                const value = new Date(cart.fechaesperadacompra);
                if (value < today) return reject({message: "La fecha esperada de compra no debe ser anterior a la fecha actual."});
            }

            cart.usuario = user;
            cart.estado = CarritoEstadoEnum.PreparacionEnPreparacion;
            cart.productos = toArray(cart.productos);
            
            const item = await this.create(cart);
            if (!item) return reject({message: 'No se pudo insertar el carrito'});

            return resolve(this.normalizeCart(item, await this.carritoEstadoService.findAll({})));
        });
    }
    
    async updateCart(cart?: Cart): Promise<Cart | undefined> {
        return new Promise(async resolve => {            
            if (cart) {
                if (!cart.estado) {
                    cart.estado = CarritoEstadoEnum.PreparacionEnPreparacion;
                }
                await this.update(toString(cart.id), cart);
            }
            return resolve(cart);
        });
    }
    
    async getProducts(id: string, full: boolean = false): Promise<ProductDistributionDTO[]>{
        return new Promise(async(resolve, reject) => {            
            const cart = await this.findById(id);
            if (!cart) return reject({message: 'No se pudo obtener el carrito.'});
            if (cart?.productos?.length > 0) {
                const productsIds = cart?.productos?.map(item => item?.id);
                let cartProducts = [];
                if (full) {
                    cartProducts = await this.productService.findAllConvert({_id: {$in: productsIds}}, true, '');                   
                } else {
                    cartProducts = await this.productService.findAll({_id: {$in: productsIds}});
                }
                const regiones = cart.estado == CarritoEstadoEnum.PreparacionEnPreparacion && carritoRequireProcess(cart) ? 
                                    await this.regionService.findAll({}) 
                                : [];

                const getDistributionState = (productItems: DistribucionItem[]): DistributionDTO => {
                    let aceptedItems = 0;
                    let totalPropposed = 0;

                    const regionesIntervientes = productItems.filter(i => this.parseNumber(i.cantidadpropuesta) > 0);
                    const distributedItems = regionesIntervientes.length;
                    
                    for (let i = 0; i < regionesIntervientes.length; i++) {
                        const item = regionesIntervientes[i];
                        totalPropposed = totalPropposed + this.parseNumber(item.cantidadpropuesta);
                        if (item.estado === DistribucionEstado.Aceptada || item.estado === DistribucionEstado.Listo) {
                            aceptedItems++;
                        }
                    }
                    
                    // Solo se deben agregar las regiones con cantidad en cero, si el carrito no fue enviado todavia a las regiones!!
                    for (let i = 0; i < regiones.length; i++) {
                        const region = regiones[i];
                        if (!productItems.some((item) => item?.id === region?.id)) {
                            productItems.push ({
                                cantidadpropuesta: 0,
                                cantidadsolicitada: 0,
                                estado: DistribucionEstado.PendienteAsignacion,
                                id: toString(region?.id),
                                name: toString(region?.name),
                            });
                        }        
                    }
                    
                    return {
                        total: totalPropposed,
                        status: `${aceptedItems} / ${distributedItems}`,            
                    }
                }

                return resolve(cartProducts.map(item => {
                    const items = toArray(cart?.productos.find(i => i.id == item.id)?.items);
                    return {
                        ...item,
                        items,
                        distribution: getDistributionState(items)
                    }
                }));
            }
            return resolve([]);
        });
    }

    async getProductsDistributionInfo(id: string, regionId: string, productId?: string): Promise<DistributionInfoProducts> {
        return new Promise(async(resolve, reject) => {            
            const cart = productId ? await this.getCart(id, true, regionId) : await this.findById(id);
            if (!cart) return reject({message: 'No se pudo obtener el carrito.'});

            if (!productId && regionId) {
                cart.productos = cart.productos.filter(i => {
                    return Array.isArray(i.items) && i.items.find(j => j.id == regionId);
                });
            }
            
            if (cart.productos.length == 0) {
                return reject({message: 'El carrito no posee productos.'});
            }
                    
            const region = await this.regionService.findOne({id: regionId});
            if (!region) {
                return reject({message: 'No se encontro la región seleccionada'});
            }
            
            cart.estrategia = await this.getNameFromService(this.estrategiaService, cart.estrategia);
            const productsItems: DistribucionInfoDTO[] = [];
            
            const items = productId ? cart.productos.filter(i => i.id == productId) : cart.productos;
            let sendedCount = 0;
            let finishCount = 0;
            let totalRegion = 0;
            let disabledSender = true; // Solo es usado cuando se busca info de un material, por ende "items" tiene un solo registro

            for (const item of items) {
                const regionItem = item.items?.find(it => it.id === regionId);
                if (regionItem) {
                    totalRegion++;
                    
                    if ([DistribucionEstado.Recibida, DistribucionEstado.Aceptada, DistribucionEstado.Listo].indexOf(regionItem.estado) >= 0) {
                        sendedCount++;
                    }
                    
                    if (regionItem.finalizado) {
                        finishCount++;
                    }

                    const productInfo = await this.productService.findById(item.id);
                    if (productInfo) {
                        productInfo.imagenes = convertImages(productInfo.imagenes, false);                
                        productsItems.push({
                            ...productInfo,
                            items: [regionItem],                            
                        });
                    }                    
                    disabledSender = regionItem.estado && [DistribucionEstado.PendienteAjuste, DistribucionEstado.Enviada].indexOf(regionItem.estado) < 0;
                }
            }
            return resolve({
                status: sendedCount == totalRegion ? DistribucionItemEstado.Enviada :
                        finishCount == totalRegion ? DistribucionItemEstado.Pendiente : 
                        DistribucionItemEstado.Incompleta,
                items: productId ? undefined : productsItems,
                item: !productId || productsItems.length == 0 ? undefined : productsItems[0],
                cart,
                title: region.name,
                disabledSender
            });
        });
    }

    async addProduct(cartId: string, productId: string): Promise<Product>{
        return new Promise(async(resolve, reject) => {      

            const cart = await this.findById(cartId);
            if (!cart) return reject({message: 'Error al obtener carrito'});

            if (cart.estado != CarritoEstadoEnum.PreparacionEnPreparacion) return reject({message: 'El carrito no se encuentra abierto para agregar material'});

            const product = await this.productService.findById(productId);
            if (!product) return reject({message: 'Error al obtener producto'});

            if (product.estado != ProductState.ACTIVO) return reject({message: 'El material se encuentra inactivo'});
            
            cart.productos = toArray(cart.productos);
            
            if (cart.productos.length > 0 && (cart.productos.some((item) => item?.id == productId)))
                return reject({message: 'El producto seleccionado ya se encuentra en el carrito'});
            
            cart.productos.push({ id: toString(product?.id) });
            await this.update(cartId, {productos: cart.productos});
            return resolve(product);
        });
    }    

    async updateCartCounts(cartId: string, productId: string, body: RegionCount[]): Promise<string> {
        return new Promise(async(resolve, reject) => {
            if (!productId || productId == '') return reject({message: 'Error: ID producto erroneo.'});
            if (!cartId || cartId == '') return reject({message: 'Error: ID carrito erroneo.'});
            if (!Array.isArray(body) || body.length == 0) return reject({message: 'Error: Regiones erroneas.'});
                            
            const cart = await this.findById(cartId);
            if (!cart) return reject({message: 'Error: No se pudo obtener el carrito'});
            if (!Array.isArray(cart.productos)) return reject({message: 'Error: No se encontro el material'});
            const productoIndex = cart.productos.findIndex((item) => item.id === productId);
            if (productoIndex < 0) return reject({message: 'Error: Producto no encontrado en el carrito.'});
            
            let requireUpdate = false;        
            const newItems = toArray(cart.productos[productoIndex].items);
            
            for (const item of body) {
                const regionData = await this.regionService.findOne({id: item.regionId});
                if (!regionData) continue;
                const cantidadpropuesta = this.parseNumber(item.count);

                const index = newItems.findIndex(i => i.id == item.regionId);
                if (index < 0) {
                    if (cantidadpropuesta > 0) {
                        requireUpdate = true;
                        newItems.push({
                            cantidadpropuesta,
                            cantidadsolicitada: 0,
                            estado: DistribucionEstado.PendienteAsignacion,
                            id: item.regionId,
                            name: regionData.name,                    
                        });
                    }                    
                } else if (this.parseNumber(newItems[index].cantidadpropuesta) != cantidadpropuesta) {
                    requireUpdate = true;
                    if (cantidadpropuesta > 0) {
                        newItems[index].cantidadpropuesta = cantidadpropuesta;
                    } else {
                        newItems.splice(index, 1);
                    }
                }
            }
            
            if (requireUpdate) {
                cart.productos[productoIndex].items = newItems;
                await this.update(cartId, {productos: cart.productos});
            }
            
            return resolve('');
        });
    }
            
    async updateProductDistribution(cartId: string, productId: string, regionId: string, items: DistribucionDestino[], finalized: boolean): Promise<{message:string}>{
        return new Promise(async(resolve, reject) => {
            const cart = await this.findById(cartId);
            if (!cart) return reject({message: 'Error: No se pudo obtener el carrito'});
            if (!productId || productId == '') return reject({message: 'Error: ID producto erroneo.'});
            if (!regionId || regionId == '') return reject({message: 'Error: ID Region erroneo.'});
            if (items.length === 0) return reject({message: 'Error: Verifique los destinos enviados.'})
            if (!cart.productos || cart.productos.length === 0) cart.productos = [{id: productId, items:[]}];
            const productoIndex = cart.productos.findIndex((item) => item.id === productId);
            if (productoIndex === -1) return reject({message: 'Error: Producto no encontrado en el carrito.'});
            const newItems = toArray(cart.productos[productoIndex].items);
            let regionItemIndex = newItems.findIndex((item) => item.id === regionId);
            if (regionItemIndex == -1) {
                const regionData = await this.regionService.findOne({id: regionId});
                if (!regionData) return reject({message: 'Error: No se pudo obtener los datos de la region.'});
                newItems.push({
                    id: regionId, // Id region o pais
                    name: regionData.name, // Nombre de la region o pais
                    cantidadpropuesta: 0,
                    cantidadsolicitada: 0,
                    estado: DistribucionEstado.PendienteAsignacion,
                    destinos: []
                });
                regionItemIndex = newItems.length - 1;
            }
            newItems[regionItemIndex].destinos = items;
            let totalSolicitados = 0;
            let totalPropuesto = 0;
            items.forEach(item => {

                if (this.parseNumber(item.cantidadpropuesta) > 0) {
                    totalPropuesto = item.cantidadpropuesta + totalPropuesto;
                }
                if (this.parseNumber(item.cantidadsolicitada) > 0) {
                    totalSolicitados = item.cantidadsolicitada + totalSolicitados;
                }
            });

            if (this.parseNumber(newItems[regionItemIndex].cantidadpropuesta) <= 0) {
                newItems[regionItemIndex].cantidadpropuesta = totalPropuesto;
            }
            newItems[regionItemIndex].cantidadsolicitada = totalSolicitados;
            newItems[regionItemIndex].finalizado = finalized;
            
            cart.productos[productoIndex].items = newItems;
            await this.update(cartId, {productos: cart.productos});
            return resolve({message: ''});
        });
    }

    async saveDistribution(cartId: string, productId: string, items: DistribucionItem[],username: string): Promise<DistribucionItem[]>{
        return new Promise(async(resolve, reject) => {

            if (!Array.isArray(items) || items.length == 0) return reject({message: 'Debe cargar al menos una cantidad distinta de cero'});

            const cart = await this.findById(cartId);
            if (!cart) return reject({message: 'Error al obtener carrito.'});

            if (!Array.isArray(cart.productos)) cart.productos = [];
                                  
            const index = cart.productos.findIndex(p => p?.id == productId);
            if (index < 0) return reject({message: 'El material no está relacionado al carrito'});
            
            const product = await this.productService.findById(productId);
            if (!product) return reject({message: 'Error al obtener producto'});

            const itemIsChanged = (newItem: DistribucionItem, oldItem: DistribucionItem): boolean => {
                if (newItem.cantidadpropuesta != oldItem.cantidadpropuesta) return true;
                if (newItem.cantidadsolicitada != oldItem.cantidadsolicitada) return true;
                if (newItem.estado != oldItem.estado) return true;
                if (!newItem.destinos && oldItem.destinos) return true;
                if (newItem.destinos && !oldItem.destinos) return true;
                return false;
            }

            const newItems = [];
            items = items.filter(item => item.cantidadpropuesta > 0);
            for (const item of items) {
                if (!cart.productos[index].items) cart.productos[index].items = [];
                const sindex = toArray(cart.productos[index].items).findIndex(i => i.id == item.id);
                
                if (sindex >= 0){
                    if (!itemIsChanged(item, toArray(cart.productos[index].items)[sindex])) {
                        newItems.push(item);
                        continue;
                    }
                }

                if (username != 'guest') {
                    item.tmusuario = username;
                    item.updatedAt = formatDate();
                } else if (sindex >= 0) {
                    item.tmusuario = toArray(cart.productos[index].items)[sindex].tmusuario;
                    item.updatedAt = toArray(cart.productos[index].items)[sindex].updatedAt;
                }

                newItems.push(item); 
            }
            cart.productos[index].items = newItems;

            await this.update(cartId, cart);
            return resolve(toArray(cart.productos[index].items));
        });
    }
    
    async sendProposals(cartId: string, litems: DistribucionInfo[], userId: string, target: CartAction): Promise<{message: string, type: string}>{
        return new Promise(async(resolve, reject) => {
            if (!Array.isArray(litems) || litems.length == 0 || !cartId || cartId == '') return reject({message: 'Invalid request'});            
            const user = await this.productService.userConfigService.getUserInfo(userId);
            if (!user) return reject({message: 'No se pudo obtener informacion del usuario'}); 
            
            const cart = await this.findById(cartId);
            const plan = await this.planService.findOne({id: cart?.plan});

            if (cart) {
                cart.productos = litems.map(item => {
                    const ditem = cart.productos.find(i => i.id == item.id && Array.isArray(i.arts));
                    return {
                        ...item,
                        arts: toArray(ditem?.arts)
                    }
                });
            }
            
            let targetStatus: DistribucionEstado;
            let carritoStatus: CarritoEstadoEnum;
            let message = '';
            let text = 'COMPRAS';
            const arrayEstados: CarritoEstadoEnum[] = [CarritoEstadoEnum.PreparacionEnPreparacion];

            switch (target) {
                case 'sendto-shop':
                    targetStatus =  DistribucionEstado.Listo;
                    carritoStatus = CarritoEstadoEnum.CompraEnCotizacion;
                    message = ' a ' + text;
                    arrayEstados.push(CarritoEstadoEnum.PreparacionEnPlanificacion);
                    break;

                case 'sendto-to':
                    targetStatus =  DistribucionEstado.Enviada;
                    carritoStatus = CarritoEstadoEnum.PreparacionEnPlanificacion;
                    text = 'REGIONES';
                    message = carritoRequireProcess(cart) ? `a ${text}` : '';
                    break;
            
                default:
                    return reject({message: 'Invalid Target'});
            }
            
            if (cart && arrayEstados.indexOf(cart.estado) < 0) {
                const estado = await this.carritoEstadoService.findOne({id: cart.estado});
                return reject({message: `Un carrito con estado ${estado?.name || "EN PREPARACION"} no puede ser enviado a ${text}`});
            }

            let submessage = toString(plan?.name);
            if (!submessage && cart) {
                submessage = cart.plan + ' - ' + cart.campania;
            }

            message = 'CARRITO ' + submessage + ' enviado' + message + ' con éxito';
            
            if (cart) {
                for (let i = 0; i < cart.productos.length; i++) {
                    const items = toArray(cart.productos[i].items).filter(item => item.cantidadpropuesta > 0);
                    for (let j = 0; j < items.length; j++) {
                        const item = items[j];
                        item.estado = targetStatus;
                        if (target === 'sendto-shop') {
                            item.finalizado = true;
                        }
                        items[j] = item;
                    }
                    cart.productos[i].items = items;
                }
                
                cart.estado = carritoStatus;
                const updateRes = await this.update(cartId, cart);
            
                if (!updateRes) return reject({message: 'Error actualizar estados de material/es'});
            }
            return resolve({message, type: 'success'});
        });
    }

    async returnProposals(cartId: string, _userInfo: JwtPayload, regionId: string): Promise<string>{
        return new Promise(async(resolve, reject) => {
            if (!cartId || !regionId) return reject({message: 'Invalid request'});
            const cart = await this.findById(cartId);
            if (!cart) return reject({message: 'Invalid request'});

            for (const item of cart.productos) {
                const actualInfo = toArray(item.items).find(i => i.id == regionId);
                if (!actualInfo) continue;
                if (!actualInfo.finalizado) {
                    return reject({message: "Todas las propuestas deben estar finalizadas."});
                }
                if (actualInfo.estado != DistribucionEstado.Aceptada) {
                    actualInfo.estado = DistribucionEstado.Recibida;
                }                
            }            
            const updateRes = await this.update(cartId, {productos: cart.productos});
            if (!updateRes) return reject({message: 'Error actualizar estados de material/es'});
            return resolve('');
        });
    }

    async getDestinations(cartId: string, productId: string, regionId: string, includeRegionInfo: boolean): Promise<any[]>{
        return new Promise(async (resolve, reject) => {
            const response: any[] = []

            const cart = await this.findById(cartId);
            if (!cart) return reject({message: "Error al obtener carrito."});

            const product = await this.productService.findById(productId);
            if (!product) return reject({message: "Error al obtener producto."});

            const region = await this.regionService.findOne({id :regionId});
            if (!region) return reject({message: "Error al obtener region."});

            const destinos = getDestinos(cart, toString(product?.id), toString(region?.id));
            if (Array.isArray(destinos) && destinos.length > 0)
                
                if (includeRegionInfo)
                    for (const i in destinos) {
                        const tipo = destinos[i]['tipo'];
    
                        switch (tipo) {
                            case 'PDV':
                                response.push({...destinos[i], ...await this.regionService.puntoDeVentaService.findOne({id: destinos[i]['id']})})
                                break;
                            case 'CD':
                                response.push({...destinos[i], ...await this.regionService.centroDistribucionService.findOne({id: destinos[i]['id']})})
                                break;
                            case 'D':
                                response.push({...destinos[i], ...await this.regionService.distribuidorService.findOne({id: destinos[i]['id']})})
                                break;
                            default:
                                break;
                        }
                    }
                else
                    for (const i in destinos) response.push(destinos[i]);
                
            return resolve(response);
        });
    }

    async updateProductDistributionStatus(cartId: string, productId: string, regionId: string, status: DistribucionEstado): Promise<string>{
        return new Promise(async(resolve, reject) => {

            const nextStatus = await this.regionService.estadoDistribucionService.findOne({id: status});
            if (!nextStatus) return reject({message: 'Error: No se puede obtener el proximo estado de la distribucion.'});

            const cart = await this.findById(cartId);
            if (!cart) return reject({message: 'Error: No se pudo obtener el carrito'});
            if (!productId || productId == '') return reject({message: 'Error: ID producto erroneo.'});
            if (!regionId || regionId == '') return reject({message: 'Error: ID Region erroneo.'});
            if (!status) return reject({message: 'Error: Estado erroneo.'});

            const productoIndex = cart.productos.findIndex((item) => item.id === productId);
            if (productoIndex === -1) return reject({message: 'Error: Producto no encontrado en el carrito.'});
            const newItems = toArray(cart.productos[productoIndex].items);
            const regionItemIndex = newItems.findIndex((item) => item.id === regionId);
            if (regionItemIndex === -1) return reject({message: 'Error: Region no encontrada en la distribucion del producto.'}); 
            
            const regionData = await this.regionService.findOne({id: regionId});
            if (!regionData) return reject({message: 'Error: No se pudo obtener los datos de la region.'});
            
            const current = newItems[regionItemIndex].estado;

            if (!nextStatusIsValid(current, status)) return reject({message: 'Error: No se pudo actualizar el estado de la distribucion.'});
            newItems[regionItemIndex].estado = status;
            if (status == DistribucionEstado.PendienteAjuste) {
                newItems[regionItemIndex].finalizado = false;
            }
            
            cart.productos[productoIndex].items = newItems;
            const updateRes = await this.update(cartId, {productos: cart.productos});
            if (!updateRes) return reject({message: 'Error: No se pudo actualizar el estado de la distribucion.'});
            
            return resolve("");
        });
    }

    async sendQuotation(cartId: string): Promise<{message: string}> {
        return new Promise(async(resolve, reject) => {      
            const cart = await this.findById(cartId);
            if (!cart || !Array.isArray(cart?.productos)) return reject({message: 'El carrito no posee productos.'});

            const productos = await this.productService.findAll({_id: {$in: cart.productos.map(i => i.id)}});
            if (productos.length == 0) return reject({message: 'No se encontraron materiales en el carrito.'}); 

            const proveedores = await this.getSuppliers(cart.productos);
            if (proveedores.length == 0) return reject({message: 'No se encontraron proveedores con materiales pendientes.'}); 

            const infoNotification: NotificationInfoSupplier[] = [];
            cart.productos.forEach(item => {
                const producto = productos.find(i => i.id == item.id);
                if (Array.isArray(item.proveedores) && producto) {
                    item.proveedores.filter(i => i.estado == SupplierEstado.Pendiente).forEach(sup => {
                        sup.estado = SupplierEstado.Enviada;
                        const supplier = proveedores.find(i => i.id == sup.id);
                        if (supplier) {
                            let index = infoNotification.findIndex(i => i.supplier.id == sup.id);     
                            if (index < 0) {
                                index = infoNotification.length;
                                infoNotification.push({
                                    supplier,
                                    products: []
                                });
                            }                            
                            infoNotification[index].products.push({
                                cantidad: this.sumCounts(item.items),
                                producto
                            });
                        }
                    });
                }
            });

            const resp = await this.update(cartId, {productos: cart.productos});
            if (resp) {
                for (const item of infoNotification) {
                    this.productService.userConfigService.sendNotification(NotificationType.CO_PROVEEDORES_ENVIO, item.supplier, {
                        id: toString(cart.id),
                        products: item.products
                    });    
                }
                return resolve({message: 'Cotizacion enviada exitosamente'});
            }
            return reject({message: 'No se pudo enviar la cotización'});
        });
    }

    async sendProductQuotitation(cartId: string, productId: string, newsuppliers?: Supplier[], onlySave: boolean = false): Promise<{message: string}>{
        return new Promise(async(resolve, reject) => {
            if (!Array.isArray(newsuppliers)) return reject({message: 'Verifique los proveedores enviados.'});
    
            const cart = await this.findById(cartId);
            if (!cart) return reject({message: 'Error al obtener carrito'});
            if (!Array.isArray(cart.productos)) return reject({message: 'El carrito no posee productos.'});
            
            if ([CarritoEstadoEnum.CompraEnCompra, CarritoEstadoEnum.CompraPropuestaProveedor, CarritoEstadoEnum.CompraEnCotizacion, CarritoEstadoEnum.CompraEnEleccionGanadores].indexOf(cart.estado) <0 ) {
                return reject({message: 'El carrito no se disponible para el procedimiento seleccionado.'});
            }

            const productIndex = cart.productos.findIndex((item) => item.id == productId);
            if (productIndex < 0) return reject({message: 'El producto seleccionado no pertenece al carrito.'});
            const product: DistribucionInfo = cart.productos[productIndex];
            // Si el producto no posee el array de proveedores lo agregamos.
            if (!Array.isArray(product.proveedores)) product.proveedores = [];
            // Dentro de los proveedores existentes almacenamos, exclusivamente, los proveedores distintos a pendiente.
            product.proveedores = product.proveedores.filter((item) => item.estado != SupplierEstado.Pendiente);
            // Verificamos que haber recibido, exclusivamente, supliers pendientes para evitar pisar datos.
            newsuppliers = newsuppliers.filter(item => item.estado == SupplierEstado.Pendiente && !toArray(product.proveedores).find(i => i.id == item.id));            
            // Si solo debemos guardar los nuevos proveedores.
            const infoNotification: NotificationInfoSupplier[] = [];

            if (!onlySave) {
                newsuppliers.forEach(item => {
                    item.estado = SupplierEstado.Enviada;
                });
                const proveedores = await this.regionService.proveedorService.findAll({_id: {$in: newsuppliers.map((item) => item.id)}});
                if (Array.isArray(proveedores) && proveedores.length > 0) {
                    const producto = await this.productService.findById(productId);
                    for (const supplier of proveedores) {
                        infoNotification.push({
                            supplier,
                            products: [
                                {
                                    cantidad: this.sumCounts(product.items),
                                    producto
                                }
                            ]
                        });
                    }
                }
            }
            
            product.proveedores = product.proveedores.concat(newsuppliers);
            cart.productos[productIndex] = product;
            
            const resp = await this.update(cartId, {productos: cart.productos});
            if (resp) {
                for (const item of infoNotification) {
                    this.productService.userConfigService.sendNotification(NotificationType.CO_PROVEEDORES_ENVIO, item.supplier, {
                        id: toString(cart.id),
                        products: item.products
                    });    
                }
                const message = onlySave ? 'Guardado con exito' : 'Cotizacion enviada exitosamente';
                return resolve({message});
            }

            reject({message: 'No se pudo guardar la información'});
        });
    }
    
    async requestProductQuotation(cartId: string, supplierId: string, body: DistribucionInfo[]): Promise<{message: string}>{
        return new Promise(async(resolve, reject) => {

            const cart = await this.findById(cartId);
            if (!cart) return reject({message: 'Error al obtener carrito'});
            if (!cart.productos || !Array.isArray(cart.productos)) return reject({message: 'El carrito no posee productos.'});

            const datosProveedor = await this.regionService.proveedorService.findById(supplierId);
            if (!datosProveedor) return reject({message: 'Error al obtener proveedor'});

            if (!body || !Array.isArray(body)) return reject({messge: 'Revise los productos enviados.'});
            const infoNotification: NotificationInfoSupplier[] = [];
            const datosProductos = await this.productService.findAll({_id: {$in: body.map((item) => item.id)} });
            for (const prod of body) {
                const productIndex = cart?.productos?.findIndex(p => p?.id == prod?.id);
                if (productIndex < 0) return reject({message: `El producto ${prod?.id} no pertenece al carrito.`});
                const product: DistribucionInfo = cart.productos[productIndex];
                if (!product.proveedores || !Array.isArray(product.proveedores)) product.proveedores = [];
                const supplier = product.proveedores.find(s => s?.id == supplierId);
                if (!supplier) {
                    const newsupplier: Supplier = { id: supplierId, estado: SupplierEstado.Enviada };
                    product.proveedores.push(newsupplier);
                    let index = infoNotification.findIndex(i => i.supplier.id == supplierId);     
                    if (index < 0) {
                        index = infoNotification.length;
                        infoNotification.push({
                            supplier: datosProveedor,
                            products: []
                        });
                    }
                    infoNotification[index].products.push({
                        cantidad: this.sumCounts(product.items),
                        producto: datosProductos.find((item) => item.id == prod.id)
                    });
                }
            }
            const resp = await this.update(cartId, {productos: cart.productos});
            if (!resp) return reject({message: 'Error al actualizar el carrito.'});
            for (const item of infoNotification) {
                this.productService.userConfigService.sendNotification(NotificationType.CO_PROVEEDORES_ENVIO, item.supplier, {
                    id: toString(cart.id),
                    products: item.products
                });    
            }
            const message = 'Solicitud enviada exitosamente';
            return resolve({message});
        });
    }    

    async updatePrices(cartId: string, supplierId: string, productsList: DistribucionInfo[], userInfo: JwtPayload): Promise<{message: string}> {
        return new Promise(async(resolve, reject) => {
            if ((!userInfo?.userId || !userInfo?.username)) return reject({message: 'Error al obtener la informacion del usuario.'});
            if (!Array.isArray(productsList)) return reject({message: 'Error al obtener el carrito.'});
            
            const usuario = userInfo.username;
            if (userInfo.userId != 'guest') {
                const user = await this.productService.userConfigService.getUserInfo(userInfo.userId);
                if ((!user)) return reject({message: 'Error al obtener la informacion del usuario.'});
            }

            const cart = await this.getCart(cartId);
            if (!cart) return reject({message: 'Error al obtener el carrito.'});
            for (let i = 0; i < productsList.length; i++) {
                const productUpdate = productsList[i];
                if (!productUpdate.proveedores) {
                    continue;
                }
                const supplierUpdate = productUpdate.proveedores.find((item) => item.id === supplierId);
                // Si el producuto no posee el proveedor pasamos al sig.
                if (!supplierUpdate) continue;
                const prodIndexInCart = cart.productos.findIndex((item) => item.id === productUpdate.id);
                // Si el carrito no posee el producto pasamos al sig.
                if (prodIndexInCart < 0) continue;
                const supplierIndexInCart = toArray(cart.productos[prodIndexInCart].proveedores).findIndex((item) => item.id === supplierId);
                if (supplierIndexInCart < 0) continue;
                // Actualizamos la informacion del provedor x producto.
                toArray(cart.productos[prodIndexInCart].proveedores)[supplierIndexInCart] = {
                    ...supplierUpdate,
                    estado: SupplierEstado.Recibida,
                    fechacotizacion: new Date()
                };
                // Cargamos el movimiento en el historico.
                const movimiento: Carritomov = {
                    idcarrito: cartId,
                    idproducto: productUpdate.id,
                    idproveedor: supplierId,
                    usuario,
                    preciounitario: supplierUpdate.preciounitario || 0,
                    diasproduccion: supplierUpdate.diasproduccion || 0
                }
                this.carritoMovService.create(movimiento);
            }
            await this.update(cartId, {productos: cart.productos});
            return resolve({message: 'Productos cotizados con exito.'});
        });
    }

    async getArts(cartid: string, productid: string): Promise<ProductArt[]> {
        const cart = await this.getCart(cartid);
        if (!cart || !Array.isArray(cart?.productos)) return [];
        const producto = cart.productos.find(i => i.id == productid);
        return toArray(producto?.arts);
    }    

    async finalizeQuotation(cartId: string): Promise<{message: string}> {
        return new Promise(async(resolve, reject) => {      
            const cart = await this.findById(cartId);
            if (!cart) return reject({message: 'Error al obtener carrito'});

            const configValue: {
                presupuestomin: number,
                presupuestomax?: number,
                proveedores: number,
            } = await this.carritoMovService.configService.find('cotizacion.presupuesto', {
                presupuestomin: 5000,
                proveedores: 3,
            });

            if (
                (Array.isArray(cart.productos)) &&
                (
                    (this.parseNumber(configValue.presupuestomin) <= 0) || 
                    (this.parseNumber(cart.presupuesto) > this.parseNumber(configValue.presupuestomin))  
                ) && (
                    (this.parseNumber(configValue.presupuestomax) <= 0) || 
                    this.parseNumber(cart.presupuesto) < this.parseNumber(configValue.presupuestomax)
                ) && (
                    (this.parseNumber(configValue.proveedores) > 0)
                )
            ) {
                const cantidadProveedoresConfig = this.parseNumber(configValue.proveedores);
                for (const item of cart.productos) {
                    const cantidadProveedoresProducto = Array.isArray(item.proveedores) ? item.proveedores.length : 0;
                    if (cantidadProveedoresProducto < cantidadProveedoresConfig) {
                        return reject({message: `Debe seleccionar al menos ${cantidadProveedoresConfig} proveedores para cada material en este carrito`});
                    }
                }
            }
            
            if (await this.update(cartId, {estado: CarritoEstadoEnum.CompraPropuestaProveedor})) {
                return resolve({message: 'Cotizaciones Finalizadas con éxito'});
            }
            
            return reject({message: 'No se pudo finalizar las cotizaciones'});
        });
    }

    async proposeWinningSupplier(cartId: string, productId: string, body: { id: string }): Promise<{message: string}> {
        return new Promise(async(resolve, reject) => {      
            if (!body?.id) return reject({message: 'Invalid Request'});
            const cart = await this.findById(cartId);
            if (!cart) return reject({message: 'Error al obtener carrito'});
            if (!cart.productos || !Array.isArray(cart.productos)) return reject({message: 'El carrito no posee productos.'});
            
            if ([CarritoEstadoEnum.CompraPropuestaProveedor, CarritoEstadoEnum.CompraEnEleccionGanadores].indexOf(cart.estado) < 0) {
                return reject({message: 'El estado del carrito es inválido.'});
            }

            const supplier = await this.regionService.proveedorService.findById(body.id);
            if (!supplier) return reject({message: 'Error al obtener proveedor'});

            const productIndex = cart.productos.findIndex(product => product?.id == productId);
            if (productIndex == -1) return reject({message: `El producto ${productId} no pertenece al carrito`});
            
            if (cart.estado == CarritoEstadoEnum.CompraEnEleccionGanadores) {
                cart.productos[productIndex].proveedoridtm = body.id;
            } else if (cart.estado == CarritoEstadoEnum.CompraPropuestaProveedor) {
                cart.productos[productIndex].proveedoridcompras = body.id;
            }

            const updateRes = await this.update(cartId, {productos: cart.productos});
            if (!updateRes) return reject({message: 'Error actualizar productos de material'});
            return resolve({message: 'Propuesta de proveedor ganador guardada exitosamente'});
        });
    }

    async changeStatusSuppliers(cartId: string, userName: string): Promise<{message: string}>{
        return new Promise(async(resolve, reject) => {

            const cart = await this.findById(cartId);
            if (!cart) return reject({message: 'Error al obtener carrito'});
            if (!cart.productos || !Array.isArray(cart.productos)) return reject({message: 'El carrito no posee productos.'});

            if ([CarritoEstadoEnum.CompraPropuestaProveedor, CarritoEstadoEnum.CompraEnEleccionGanadores].indexOf(cart.estado) < 0) {
                return reject({message: 'El estado del carrito es inválido.'});
            }

            let changeItems = false;

            for (const product of cart?.productos) {
                if (!product?.proveedoridcompras) {
                    return reject({message: "Todos los productos deben tener proveedores propuestos."})
                }
                
                if (cart.estado == CarritoEstadoEnum.CompraEnEleccionGanadores && !product?.proveedoridtm) {
                    changeItems = true;
                    product.proveedoridtm = product.proveedoridcompras;
                }
            }

            if (cart.estado == CarritoEstadoEnum.CompraPropuestaProveedor) {
                cart.estado = CarritoEstadoEnum.CompraEnEleccionGanadores;
            } else if (cart.estado == CarritoEstadoEnum.CompraEnEleccionGanadores) {                
                cart.estado = CarritoEstadoEnum.CompraEnCompra;
            }

            const saveFields: any = {
                estado : cart.estado
            };

            if (changeItems) {
                saveFields["productos"] = cart.productos;
            }
            
            const resp = await this.update(cartId, saveFields);
            if (!resp) return reject({message: 'Error al actualizar el carrito.'});

            const message = 'Solicitud enviada exitosamente';

            if (cart.estado == CarritoEstadoEnum.CompraEnCompra) {
                const users = await this.getUsersCompras(userName);
                this.productService.userConfigService.sendNotification(NotificationType.TM_PROVEEDORES_GANADORES, undefined, undefined, 
                    {
                        cart,
                        users, 
                        userInfo: users.find(i => i.username == userName),
                    });        
            } else {
                const users = await this.getUsersTM(cart, true, userName);
                this.productService.userConfigService.sendNotification(NotificationType.CO_PROVEEDORES_GANADORES, undefined, undefined, 
                    {
                        cart,
                        users, 
                        userInfo: users.find(i => i.username == userName),
                    });        
            }
            
            return resolve({message});
        });
    }  

    async getUsersCompras(aditionalUserName?: string): Promise<UserInfo[]> {
        const users = await this.productService.userConfigService.findUsers({});
        const GROUPID_COMPRA = configurationGet(Configuration.GROUPID_COMPRA);
        return toArray(users).filter(user => user?.username == aditionalUserName || toArray(user?.groups).some((group: any) => group == GROUPID_COMPRA));
    }

    async getUsersTM(cart: Cart, checkCompartidoCon: boolean = false, aditionalUserName?: string): Promise<UserInfo[]> {
        if (!cart?.id) return [];
        const users = await this.productService.userConfigService.findUsers({});
        const creator = users.find(user => user?.username == cart.usuario);
        
        if (checkCompartidoCon) {
            if (cart?.compartidocon && cart.compartidocon != 'all') {
                const sharedUsers = cart.compartidocon.split(",");
                return users.filter(user => 
                    user?.username == aditionalUserName || 
                    user?.username == cart.usuario || 
                    sharedUsers.indexOf(user?.username) >= 0);
            }
            return users.filter(user => 
                    user?.username == aditionalUserName || 
                    user?.username == cart.usuario || 
                    user?.groups?.some((group: any) => toArray(creator?.groups).indexOf(group) >= 0));
        }

        return users.filter(user => user?.username != cart.usuario && user?.groups?.some((group: any) => toArray(creator?.groups).indexOf(group) >= 0));
    }    

    async deleteProducto(idcarrito: string, idproducto: string, userName: string, postergar: boolean): Promise<boolean> {
        const carrito = await this.findById(idcarrito);
        if (!carrito || !Array.isArray(carrito?.productos)) return false;

        const index = carrito.productos.findIndex(i => i.id == idproducto);
        if (index < 0) return false;

        const result = postergar ? 
                await this.carritoMovService.carritoPostergadoService.addTo(carrito, idproducto, userName) :
                carritoDeleteEnabled(carrito);
                    
        if (result) {
            carrito.productos.splice(index, 1);
            if (await this.update(toString(carrito.id), {productos: carrito.productos})) {
                return true;
            }    
        }

        return false;
    }

    private getImageName(config?: ConfigValues, total?: number, enFecha?: number) {
        let image = 'good';
        if (config?.bad && config?.good && config?.medium && this.parseNumber(total) > 0) {
            const porcentaje = this.parseNumber(enFecha) * 100 / this.parseNumber(total); 
            if (porcentaje < this.parseNumber(config.bad.max)) {
                image = 'bad';
            } else if (
                porcentaje >= this.parseNumber(config.medium.min) && 
                porcentaje < this.parseNumber(config.medium.max)
            ) {
                image = 'medium';
            }
        }
        return AppModule.URL + '/upload/widgets/'+image+'.png';
    }

    async getCarritosTotales() {
        let config: ConfigInfo | undefined;
        let carritos: Cart[] = [];
           
        await Promise.all([
            this.getDashboardConfig(),
            this.findAll({fechaesperadacompra: {$exists: true}, estado: {$nin: [CarritoEstadoEnum.Cerrado]}}),                        
        ])
        .then(responses => {
            config = responses[0];
            carritos = responses[1];                    
        })
        .catch(errorFn)
        
        const getPercentagesCaption = (prop: 'good' | 'medium' | 'bad'): string => {
            const value = (!config?.percentages) ? undefined : config.percentages.value[prop];
            if (!value) return prop == "good" ? "80% a 100%" : prop == "medium" ? "40% a 80%" : "0% a 40%";
            return `${value.min}% a ${value.max}%`;
        }

        const actual = formatDate().substring(0, 10);
        const carritosEnFecha = carritos.filter(i => i.fechaesperadacompra.substring(0, 10) >= actual).length;
        const carritosTotales = carritos.length;
        const image = this.getImageName(config?.percentages?.value, carritosTotales, carritosEnFecha);
        return {
            image,
            link: {
                url: this.productService.userConfigService.webUrl() + '/fases',
            },
            info: {
                color: image.includes("good.") ? 'success' : image.includes("bad.") ? 'error' : 'warning',
                count: carritosTotales,
                caption: "Carritos",
                config: {                  
                    title: "En fecha",
                    percentages: [
                        {
                            image: AppModule.URL + "/upload/widgets/good.png",
                            caption: getPercentagesCaption('good'),
                        },
                        {
                            image: AppModule.URL + "/upload/widgets/medium.png",
                            caption: getPercentagesCaption('medium'),
                        },
                        {
                            image: AppModule.URL + "/upload/widgets/bad.png",
                            caption: getPercentagesCaption('bad'),
                        },
                    ]
                },
                items: [
                    {
                        image: AppModule.URL + "/upload/widgets/ok.png",
                        caption: "En fecha",
                        count: carritosEnFecha,
                    },
                    {
                        image: AppModule.URL + "/upload/widgets/warning.png",
                        caption: "Retrasados",
                        count: carritosTotales - carritosEnFecha,
                    }
                ]
            }
        };
    }

    async getCarritoEnCompras(id: string): Promise<CarritoOrdenesCompra> {
        const ordenescompra: OrdenCompraVM[] = [];
        let carrito: CartVM | undefined;

        await Promise.all([
            this.getCart(id, false), // No se busca FULL la info, ya que los productos del carrito no importan. Importan los productos de los OCs
            // this.ordenCompraService.getFromCartId(id),
        ])
        .then(responses => {
            carrito = responses[0];
        })
        .catch(errorFn);

        return {
            carrito,
            ordenescompra
        }
    }

    async getCarritosPorFase(type: 'header' | 'detail') {
        let estados : CarritoEstado[] = [];
        let carritos: Cart[] = [];
        let config: ConfigInfo | undefined;

        const getConfig = (): Promise<ConfigInfo | undefined> => {
            return new Promise(async resolve => {
                if (type == 'detail') 
                    resolve(await this.getDashboardConfig())
                else 
                    resolve(undefined);
            });
        } 

        await Promise.all([
            this.carritoEstadoService.findAll({}),
            this.findAll({}),
            getConfig(),
        ])
        .then(responses => {
            estados = responses[0];
            carritos = responses[1];    
            config = responses[2];
        })
        .catch(errorFn);

        const registros: FaseHeaderItem[] = [];
        const details: FaseDetailItem[] = [];

        for (const item of estados) {
            const index = registros.findIndex(i => i.caption == item.fase);
            if (index >= 0) continue;

            const estadosFase = estados.filter(i => i.fase == item.fase);
            const totalFase = carritos.filter(i => estadosFase.some(j => j.id == i.estado)).length;
            registros.push({
                color: 'secondary',
                count: totalFase,
                caption: item.fase,
                image: AppModule.URL + '/upload/widgets/' + replaceAll(item.fase, ['á', 'é', 'í', 'ó', 'ú'], ['a', 'e', 'i', 'o', 'u']).toLowerCase() + '.png'
            }); 

            if (type === 'detail' && estadosFase.length > 0) {

                const newItem: FaseDetailItem = {
                    image: '',
                    items: [],
                    title: item.fase,
                }
                
                const actual = formatDate().substring(0, 10);
                let totalEnFecha = 0;
                for (const subitem of estadosFase) {
                    const carritosEstado = carritos.filter(i => subitem.id == i.estado);
                    const totalEnFechaEstado = carritosEstado.filter(i => i.fechaesperadacompra.substring(0, 10) >= actual).length;
                    totalEnFecha = totalEnFecha + totalEnFechaEstado;
                    newItem.items.push({
                        label: subitem.name,
                        count: carritosEstado.length,
                        childrens: [
                            {
                                label: 'En fecha',
                                color: 'success',
                                count: totalEnFechaEstado,
                            },{
                                label: 'Retrasados',
                                color: 'error',
                                count: carritosEstado.filter(i => i.fechaesperadacompra.substring(0, 10) < actual).length,
                            },
                        ]
                    });
                }
                newItem.image = this.getImageName(config?.percentages?.value, totalFase, totalEnFecha);
                details.push(newItem);
            }            
        }
                
        return type === 'detail' ? details : registros;
    }
}

interface DistributionInfoProducts {
    title: string,
    cart?: Cart,
    status?: DistribucionItemEstado,
    items?: DistribucionInfoDTO[],
    item?: DistribucionInfoDTO,
    disabledSender: boolean,
}

export interface ConfigInfo {
    percentages: {
      visibled: boolean;
      value: ConfigValues;
    };
}
  
export interface ConfigItem {
    min: number; 
    max: number; 
}

export interface ConfigValues {
    good: ConfigItem,
    medium: ConfigItem,
    bad: ConfigItem,
}

interface FaseHeaderItem {
    color: string,
    count: number,
    caption: string,
    image: string,
}

interface FaseDetailItem {
    title: string, // nombre de fase
    image: string, //'https://shopping.api.dev.proguidemc.com/upload/widgets/good.png',
    items: {
        count: number, // cantidad de carritos en este estado
        label: string, // nombre de estado
        childrens: {
            color: 'success' | 'error',
            count: number, // 10,
            label: 'En fecha' | 'Retrasados'
        }[]
    }[],
}

interface CarritoOrdenesCompra {
    carrito?: CartVM;
    ordenescompra: OrdenCompraVM[];
}
