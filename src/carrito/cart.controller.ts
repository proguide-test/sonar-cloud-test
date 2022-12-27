import { Controller, Get, Post, UseGuards, Res, Req, Body, Param, Put, Query, Delete, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { DistribucionEstado } from '../shared/estadodistribucion/model/estadodistribucion.model';
import { RegionService } from '../shared/region/region.service';
import { CartService } from './cart.service';
import { Cart, CartAction, CartType, DistribucionDestino, DistribucionInfo, DistribucionItem, DistribucionTipo, getMaterialesRegion, getRegionesCarrito, getResponsableTMRegion, ProductArt, RegionCount, Supplier, SupplierEstado } from './model/cart.model';
import { AppModule } from '../app.module';
import { errorFn, nextStatusIsValid, toArray, toString, uploadFile } from '../shared/utils/utils';
import { CarritoEstadoEnum } from './model/carritoestado.model';
import { EndPointResponse, HttpRequest, HttpResponse } from '@proguidemc/http-module';
import { Region } from '../shared/region/model/region.model';
import { Product } from '../producto/model/producto.model';
import { NotificationType } from '../shared/userconfig/userconfig.service';
import { LugarVM } from '../shared/lugar/model/lugar.model';

@ApiTags("Carrito")
@UseGuards(AuthGuard('jwt'))
@Controller('cart')
export class CartController {

    constructor(
        private cartService: CartService,
        private regionService: RegionService,
    ) {}

    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest, 
    ) {
        const regiones: Region[] =[];
        const productos: Product[] =[];
        let lugar: any;
        let proveedor: any;

        const getSourcesId = async (userid: string): Promise<string[]> => {
            const item = await this.cartService.productService.userConfigService.get(userid);
            if (Array.isArray(item?.origenesid)) {
                return item.origenesid;
            }
            return [];
        }
    
        const getSources = async (userid: string): Promise<LugarVM[]> => {
            const info = await this.cartService.productService.userConfigService.get(userid);
            if (Array.isArray(info?.origenesid)) {
                return this.cartService.productService.userConfigService.getInfoEntities(info.origenesid);
            }        
            return [];
        }

        await Promise.all([
            this.cartService.productService.userConfigService.lugarService.findOne({id: "1"}),
            this.cartService.productService.findAllTest(),
            this.regionService.findAll({}),
            this.cartService.regionService.proveedorService.findOne({}),
            this.cartService.getUsersCompras().catch(errorFn),
            getSourcesId(req.user.userId),
            getSources(req.user.userId),
        ])
        .then(resp => {
            lugar = resp[0];
            productos.push(...resp[1]);
            regiones.push(...resp[2]);
            proveedor = resp[3];
        })
        .catch(errorFn);
        
        if (!lugar || productos.length == 0 || regiones.length == 0) return res.send({status: 'Error 3'});
        
        const cart = await this.cartService.instanceCart({
            campania: 'test jest',
            centrocosto: '1',
            compartidocon: '',
            cuenta: '1',
            descripcion: '1',
            estado:  CarritoEstadoEnum.PreparacionEnPreparacion,
            estrategia: 'region',
            fechaesperadacompra: '',
            plan: '1',
            presupuesto: 1000,
            productos: [],            
        }, req.user.username).catch(errorFn);
        if (!cart) return res.send({status: 'Error 1'});
        
        await this.cartService.updateCart({...cart, descripcion: 'test actualizado'});
        
        const cid = toString(cart.id);
        const productId = toString(productos[0]._id);
        const regionId = toString(regiones[0]._id);
        
        await this.cartService.getProducts(cid, true).catch(errorFn);
        await this.cartService.returnProposals(cid, req.user, regionId).catch(errorFn);
        await this.cartService.getDestinations(cid, productId, regionId, true).catch(errorFn);
        
        const user = {
            email: 'mborgo@proguidemc.com',
            firstName: 'test',
            id: req.user.userId,
            lastName: 'test',
            username: req.user.username,                    
        };
        this.cartService.productService.userConfigService.sendNotification(NotificationType.CO_PROVEEDORES_GANADORES, undefined, undefined, 
            {
                cart,
                users: [user], 
                userInfo: user,
            });  
        
        await this.cartService.addProduct(cid, productId).catch(errorFn);
        await this.cartService.addProduct(cid, productId).catch(errorFn);
        
        const listProductos: DistribucionItem[] = [{
            cantidadpropuesta: 15,
            cantidadsolicitada: 15,
            estado: DistribucionEstado.PendienteAsignacion,
            id: regionId,
            name: regiones[0].name,
        }];
        await this.cartService.updateCartCounts(cid, productId, [{
            count: 10,
            regionId
        }]).catch(errorFn);

        await this.cartService.updateCartCounts(cid, productId, [{
            count: 20,
            regionId
        }]).catch(errorFn);
    
        await this.cartService.updateProductDistribution(cid, productId, regionId, [{
            cantidadpropuesta: 10,
            cantidadsolicitada: 10,
            id: lugar.id,
            name: '',
            tipo: DistribucionTipo.PUNTO_VENTA
        }], false).catch(errorFn);

        if (regiones.length > 1) {
            await this.cartService.updateProductDistribution(cid, productId, toString(regiones[1]._id), [{
                cantidadpropuesta: 10,
                cantidadsolicitada: 10,
                id: lugar.id,
                name: '',
                tipo: DistribucionTipo.PUNTO_VENTA
            }], false).catch(errorFn);
        }

        await this.cartService.carritoMovService.carritoPostergadoService.addTo(cart, productId, req.user.username);
        await this.cartService.updateProductDistribution(cid, productId, regionId, [], true).catch(errorFn);
        await this.cartService.getProductsDistributionInfo(cid, regionId, productId).catch(errorFn);
        await this.cartService.saveDistribution(cid, productId, listProductos, req.user.username).catch(errorFn);
        await this.cartService.saveDistribution(cid, productId, listProductos, req.user.username).catch(errorFn);

        await this.updateStatusDistribution(cid, productId, regionId, {estado: DistribucionEstado.Enviada}).catch(errorFn);
           
        await this.updateUsers(cid, {users: ['all']});
        await this.GetUsersCart(cid);
        await this.setArt(cid, productId, [{
            archivo: '{app}/test.png',
            name: 'test'
        }]);
        
        const proveedorId = toString(proveedor?.id);   
        const itemsQuotation = [{
            id: proveedorId,
            estado: SupplierEstado.Pendiente,
            preciounitario: 100,
            diasproduccion: 60,
        }];     
        await this.sendQuotation(cid, productId, false, itemsQuotation).catch(errorFn);
        
        await this.getCartById(cid, true, false);
        const reloadCart = await this.cartService.findById(cid);
        const prods = toArray(reloadCart?.productos);

        reloadCart && await this.cartService.carritoMovService.carritoPostergadoService.addTo(reloadCart, productId, req.user.username);
        
        await this.cartService.sendProposals(cid, prods, req.user.userId, 'sendto-shop').catch(errorFn); 
        await this.cartService.sendProposals(cid, prods, req.user.userId, 'sendto-to').catch(errorFn); 
        
        await this.finalizeQuotation(cid, "", false, []);
        await this.finalizeQuotation(cid, productId, false, itemsQuotation);

        listProductos[0].estado = DistribucionEstado.Recibida;
        
        const distribucion = [{
            id: productId,
            arts: [],
            items: listProductos,
            proveedores: [{
                id: proveedorId,
                estado: SupplierEstado.Recibida,
                preciounitario: 100,
                diasproduccion: 60,
            }],                
        }];
        
        getRegionesCarrito({...cart, productos: distribucion});
        getMaterialesRegion({...cart, productos: distribucion}, regionId, [productos[0]]);
        getResponsableTMRegion({...cart, productos: distribucion}, regionId);

        await this.cartService.getQuotation(cid, productId).catch(errorFn);
        await this.cartService.requestProductQuotation(cid, proveedorId, distribucion).catch(errorFn);            
        await this.cartService.updatePrices(cid, proveedorId, distribucion, req.user).catch(errorFn);  
        await this.cartService.proposeWinningSupplier(cid, productId, {id: proveedorId}).catch(errorFn);  

        await this.sendQuotation(cid, "", false, []);

        await this.SendproposeWinersTm(cid, req);

        await this.deleteProduct(cid, productId, req).catch(errorFn); 
        await this.deleteProducto(cid, productId, req).catch(errorFn); 
        
        await this.getCartById(cid, true, true);
                
        nextStatusIsValid(DistribucionEstado.Enviada, DistribucionEstado.Recibida);
        nextStatusIsValid(DistribucionEstado.PendienteAsignacion, DistribucionEstado.Enviada);
        nextStatusIsValid(DistribucionEstado.Recibida, DistribucionEstado.PendienteAjuste);
        nextStatusIsValid(DistribucionEstado.Recibida, DistribucionEstado.Aceptada);
        nextStatusIsValid(DistribucionEstado.PendienteAjuste, DistribucionEstado.Recibida);
        nextStatusIsValid(DistribucionEstado.PendienteAjuste, DistribucionEstado.PendienteAjuste);
        
        res.send("OK");
    }

    @Get('')
    @EndPointResponse({summary: 'Obtener lista de carritos', operationId: 'lista-carritos' })
    async GetCarts(
        @Query("type") type: CartType,
        @Res() res: HttpResponse,
    ) {
        this.cartService.getCarts(type)
        .then(resp => {
            res.send(resp)
        })
        .catch(_error => {
            res.send([]);
        })        
    }

    @Get('states')
    @EndPointResponse({ summary: 'Obtener lista de estados de carrito', operationId: 'lista-carrito-estados' })
    async GetStates(
        @Res() res: HttpResponse,
        @Query("all") all: boolean,
        @Query("type") type: CartType,
    ) {
        this.cartService.carritoEstadoService.findAll(
                all ?
                    {} :
                type === "cotizaciones" ?
                    {id: {$in: [
                        CarritoEstadoEnum.CompraEnCompra, 
                        CarritoEstadoEnum.CompraEnCotizacion, 
                        CarritoEstadoEnum.CompraEnEleccionGanadores, 
                        CarritoEstadoEnum.CompraPropuestaProveedor
                        ]}
                    }
                :
                    {id: {$nin: [CarritoEstadoEnum.PreparacionEnPreparacion, CarritoEstadoEnum.PreparacionEnPlanificacion, CarritoEstadoEnum.Cerrado]}}
            )
        .then(resp => {
            res.send(resp)
        })
        .catch(_error => {
            res.send([]);
        })
    }

    @Get('fases')
    @EndPointResponse({summary: 'Obtener lista de carrito agrupados por fase', operationId: 'lista-carrito-fases' })
    async GetFases(
        @Res() res: HttpResponse,
    ) {
        this.cartService.getCarritosPorFase('detail')
        .then(resp => {
            res.send(resp);
        })
        .catch(_error => {
            res.send([]);
        })
    }

    @Get('quotation/:cartid')
    @EndPointResponse({ summary: 'Obtener lista de carritos', operationId: 'lista-carritos' })
    async GetQuotation(
        @Param("cartid") cartid: string,
        @Res() res: HttpResponse,
        @Query("productid") productid?: string,
    ) {
        this.cartService.getQuotation(cartid, productid)
        .then(resp => {
            res.send(resp);
        })
        .catch(_error => {
            res.send([]);
        })
    }

    @Post('sendquotation/product/:cartid')
    @EndPointResponse({summary: 'Agrega un producto a un carrito', operationId: 'agregar-producto-a-carrito' })
    async sendQuotation(
        @Param("cartid") cartId: string, // id carrito
        @Query("productid") productId: string, // id producto
        @Query("onlysave") onlysave: boolean,
        @Body() body: Supplier[] | undefined,
        @Res() res?: HttpResponse,
    ) {
        if (!productId) {
            return this.cartService.sendQuotation(cartId)
            .then(resp => {
                res?.status(200).send(resp);
                return null;
            })
            .catch(error => {
                res?.status(500).send(error);
                return null;
            })
        }
        
        return this.cartService.sendProductQuotitation(cartId, productId, body, onlysave)
        .then(resp => {
            res?.status(200).send(resp);
            return null;            
        })
        .catch(error => {
            res?.status(500).send(error);
            return null;
        })
    }
    
    @Post('requestquotation/:cartid/products/:supplierid')
    @EndPointResponse({summary: 'Agrega el proveedor de los productos seleccionados.', operationId: 'agregar-proveedor-productos-carrito' })
    async requestQuotation(
        @Param("cartid") cartId: string, // id carrito
        @Param("supplierid") supplierId: string,
        @Body() body: DistribucionInfo[],
        @Res() res: HttpResponse,
    ) {
        this.cartService.requestProductQuotation(cartId, supplierId, body)
        .then(resp => {
            res.status(200).send(resp);
        })
        .catch(error => {
            res.status(500).send(error);
        })
    }

    @Post('sendprices/:cartid/:supplierid')
    @EndPointResponse({summary: 'Alta o actualizacion de carrito', operationId: 'nuevo-actualizar-carrito' })
    async sendPrices(
        @Param("cartid") cartId: string, // id carrito
        @Param("supplierid") supplierId: string, // id proveedor
        @Body() body: DistribucionInfo[],
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        this.cartService.updatePrices(cartId, supplierId, body, req?.user)
        .then(resp => {
            res.send(resp);
        })
        .catch(_error => {
            res.send([]);
        })
    }
    
    @Post('proposewinningsupplier/:cartid/products/:productid')
    @EndPointResponse({ summary: 'Propuesta de proveedor de compra ganadora', operationId: 'propuesta-proveedor-compras-ganador' })
    async ProposeWinningSupplier(
        @Param("cartid") cartId: string, // id carrito
        @Param("productid") productId: string, // id producto
        @Body() body: { id: string },
        @Res() res: HttpResponse,
    ) {
        this.cartService.proposeWinningSupplier(cartId, productId, body)
        .then(resp => {
            res.send(resp);
        })
        .catch(_error => {
            res.send([]);
        })
    }

    @Post('send-propose-winners/:cartid')
    @EndPointResponse({summary: 'Envia propuesta de proveedores ganadores a TM.', operationId: 'enviar-propuesta-proveedores-carrito' })
    async SendproposeWinersTm(
        @Param("cartid") cartId: string, // id carrito
        @Req() req: HttpRequest,
        @Res() res?: HttpResponse,
    ) {
        return this.cartService.changeStatusSuppliers(cartId, req.user.username)
        .then(resp => {
            res?.status(200).send(resp);
            return null;
        })
        .catch(error => {
            res?.status(500).send(error);
            return null;
        })
    }

    @Get(':cartid')
    @EndPointResponse({summary: 'Obtener carrito x ID', operationId: 'carrito-por-id' })
    async getCartById(
        @Param("cartid") cartid: string,
        @Query("full") full: boolean,
        @Query("compras") compras: boolean,        
        @Res() res?: HttpResponse,
    ) {
        return (compras ? this.cartService.getCarritoEnCompras(cartid) : this.cartService.getCart(cartid, full))
        .then(resp => {
            res?.status(HttpStatus.OK).send(resp);
            return null;
        })
        .catch(error => {
            res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            return null;
        });
    }

    @Post('')
    @EndPointResponse({ summary: 'Alta o actualizacion de carrito', operationId: 'nuevo-actualizar-carrito' })
    async post(
        @Body() body: Cart,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        if (!body?.plan) return res.status(500).send({ message: "Invalid request."});
        (body?.id ? this.cartService.updateCart(body) : this.cartService.instanceCart(body, req.user?.username))
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        });
    }

    @Put('users/:id')
    @EndPointResponse({summary: 'Actualizar usuarios de carrito', operationId: 'actualizar-usuarios-carrito' })
    async updateUsers(
        @Param('id') id: string,
        @Body() body: {
            users: string[]
        },
        @Res() res?: HttpResponse,
    ) {
        const cart = await this.cartService.findById(id);
        if (!cart) {
            return res?.status(500).send({message: 'No se encontró el carrito.'});
        }

        if (Array.isArray(body?.users)) {
            const oldValue = cart.compartidocon ? cart.compartidocon.split(',') : [];

            body.users.length == 0 && body.users.push("all");
            oldValue.length == 0 && oldValue.push("all");
            
            let message = oldValue.length <= body.users.length ? 
                'Se agregó el usuario al carrito'
                :
                'Se eliminó el usuario del carrito';
            
            if (body.users.indexOf('all') >= 0) {
                cart.compartidocon = 'all';
                message = 'El carrito fue compartido con todos los usuarios';
            } else {
                cart.compartidocon = body.users.join(',');
            }

            const isSame = (array1: string[], array2: string[]): boolean => {
                if (array1.length != array2.length) return false;
                for (const item of array1) {
                    if (array2.indexOf(item) < 0) return false;
                }
                return true;
            }

            if (isSame(oldValue, body.users)) {
                return res?.status(204).send();
            }

            const resp = await this.cartService.update(toString(cart.id), cart);
            if (resp) {
                return res?.status(200).send({message});
            }
        }

        return res?.status(500).send({message: 'No se pudo actualizar el carrito'});
    }

    @Get('users/:id')
    @EndPointResponse({summary: 'Obtener ususarios de un carrito x ID', operationId: 'obtener-usuarios-carrito-x-id' })
    async GetUsersCart(
        @Param("id") id: string,
        @Res() res?: HttpResponse,
    ) {
        const cart = await this.cartService.findById(id);

        if (cart?.usuario) {
            const items = await this.cartService.getUsersTM(cart);
            const resp = items.map(item => { 
                return { 
                    id: item?.username, 
                    name: item?.firstName + " " + item?.lastName 
                } 
            });
            res?.send(resp);
            return resp;
        }

        res?.send([]);
        return null;
    }
   
    @Post('products/:cartid/:productid')
    @EndPointResponse({summary: 'Agrega un producto a un carrito', operationId: 'agregar-producto-a-carrito' })
    async AddProduct(
        @Param("cartid") cartId: string, // id carrito
        @Param("productid") productId: string, // id producto
        @Res() res: HttpResponse,
    ) {
        this.cartService.addProduct(cartId, productId)
        .then(async _ => {
            res.status(200).send(await this.cartService.getCart(cartId));
        })
        .catch(error => {
            res.status(500).send(error);
        });
    }

    @Get('products/:id')
    @EndPointResponse({summary: 'Obtener productos de carrito.', operationId: 'obtener-productos-carrito' })
    async GetProductsCart(
        @Param("id") id: string,
        @Query("full") full: boolean,
        @Res() res: HttpResponse,
    ) {
        this.cartService.getProducts(id, full)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp)
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error)
        })
    }

    @Get('info-distribution/:cartid/:regionid')
    @EndPointResponse({summary: 'Obtener productos de carrito.', operationId: 'obtener-productos-carrito' })
    async GetProductsDistributionCart(
        @Param("cartid") cartId: string,
        @Param("regionid") regionId: string,
        @Res() res: HttpResponse,
    ) {
        this.cartService.getProductsDistributionInfo(cartId, regionId)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp)
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error)
        })
    }

    @Post('info-distribution/:cartid/:regionid')
    @EndPointResponse({summary: 'Envia las propuestas de distribucion.', operationId: 'Enviar-propuestas-de-distribucion' })
    async setProductsDistributionCart(
        @Param("cartid") cartId: string,
        @Param("regionid") regionId: string,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        this.cartService.returnProposals(cartId, req?.user, regionId)
        .then(() => {
            return res.send({message: 'Propuestas enviadas con exito', type: 'success'});
        })
        .catch((error: any) => {
            return res.status(500).send(error);
        });
    }

    @Get('info-distribution/:cartid/:regionid/product/:productid')
    @EndPointResponse({summary: 'Obtener productos de carrito.', operationId: 'obtener-productos-carrito' })
    async GetProductDistributionCart(
        @Param("cartid") cartId: string,
        @Param("regionid") regionId: string,
        @Param("productid") productId: string,
        @Res() res: HttpResponse,
    ) {
        this.cartService.getProductsDistributionInfo(cartId, regionId, productId)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp)
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error)
        })
    }

    @Post('save-distribution/:cartid/products/:productid')
    @EndPointResponse({summary: 'Cargar distribucion de producto por carrito.', operationId: 'cargar-distribucion-de-producto-x-carrito' })
    async saveDistribution(
        @Param("cartid") cartId: string, // id carrito
        @Param("productid") productId: string, // id producto
        @Body() body: DistribucionItem[],
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        this.cartService.saveDistribution(cartId, productId, body, req?.user?.username)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp)
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error)
        })
    }

    @Post('send-proposals/:cartid')
    @EndPointResponse({summary: 'Envia las propuestas de distribucion.', operationId: 'Enviar-propuestas-de-distribucion' })
    async SendProposals(
        @Param("cartid") cartId: string, // id carrito
        @Query("target") target: CartAction,
        @Body() body: DistribucionInfo[],
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        if (!body || body.length == 0) return res.status(400).send({message: 'Verifique la lista de materiales enviados'});
        this.cartService.sendProposals(cartId, body, req?.user?.userId, target)
        .then(resp => {
            return res.send(resp);
        })
        .catch((error: any) => {
            return res.status(500).send(error);
        })        
    }

    @Put('count-distribution/:cartid/products/:productid')
    @EndPointResponse({summary: 'Actualizar cantidad propuesta de distribucion', operationId: 'actualizar-cantidad-region' })
    async UpdateCount(
        @Param("cartid") cartId: string,
        @Param("productid") productId: string,
        @Body() body: RegionCount[],
        @Res() res: HttpResponse,
    ) {
        this.cartService.updateCartCounts(cartId, productId, body)
        .then(message => {
            if (message) return res.status(500).send({message});
            return res.status(204).send();
        })
        .catch(error => {
            res.status(500).send(error);    
        })        
    }
    
    @Post('update-distribution/:cartid/products/:productid/region/:regionid/destinations')
    @EndPointResponse({summary: 'Actualizar distribucion .', operationId: 'actializar-destinos-productos' })
    async UpdateDistribution(
        @Param("cartid") cartId: string,
        @Param("productid") productId: string,
        @Param("regionid") regionId: string,
        @Query("finalized") finalized: boolean,
        @Body() body: DistribucionDestino[],
        @Res() res: HttpResponse,
    ) {
        if (!body || body.length == 0) return res.status(400).send({message: 'Verifique la lista de materiales enviados'});
        const item = await this.cartService.updateProductDistribution(cartId, productId, regionId, body, finalized).catch(errorFn);
        if (!item || item.message) return res.status(500).send({message: 'Verifique la lista de materiales enviados'});
        return res.send(item);
    }

    @Get('update-distribution/:cartid/products/:productid/region/:regionid/destinations')
    @EndPointResponse({summary: 'Obtener destinos de distribucion de producto de carrito por region.', operationId: 'obtener-destinos-region-producto-carrito' })
    async GetCartProductDistributionDestinationsByRegion(
        @Param("cartid") cartId: string,
        @Param("productid") productId: string,
        @Param("regionid") regionId: string,
        @Query("includeregioninfo") includeRegionInfo: boolean,
        @Res() res: HttpResponse,
    ) {
        this.cartService.getDestinations(cartId, productId, regionId, includeRegionInfo)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp)
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error)
        })
    }
    
    @Post('status-distribution/:cartid/products/:productid/region/:regionid')
    @EndPointResponse({summary: 'Actualizar estado de distribucion .', operationId: 'actializar-estado-de-distribucion' })
    async updateStatusDistribution(
        @Param("cartid") cartId: string,
        @Param("productid") productId: string,
        @Param("regionid") regionId: string,
        @Body() body: {estado: DistribucionEstado},
        @Res() res?: HttpResponse,
    ) {
        if (!body?.estado) {
            res?.status(400).send({message: 'Verifique el estado enviado'});
            return null;
        }

        return this.cartService.updateProductDistributionStatus(cartId, productId, regionId, body.estado)
        .then(_resp => {
            res?.send({message: "Estado de la distribucion actualizado correctamente", type: 'success'});
            return _resp;
        })
        .catch((error: any) => {
            res?.status(500).send(error);
            return null;
        })        
    }

    @Get('arts-distribution/:cartid/:productid')
    @EndPointResponse({summary: 'Validar token enviado por la region.', operationId: 'validar-token' })
    async getArts(
        @Param("cartid") cartid: string,
        @Param("productid") productid: string,
        @Res() res: HttpResponse,
    ) {
        this.cartService.getArts(cartid, productid)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp)
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error)
        })
    }

    @Post('arts-files/:cartid/:productid')
    async files(
        @Query("maxsize") size: number,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {       
        uploadFile(req, res, "arts", size);
    }

    @Post('arts-distribution/:cartid/:productid')
    @EndPointResponse({summary: 'Validar token enviado por la region.', operationId: 'validar-token' })
    async setArt(
        @Param("cartid") cartid: string,
        @Param("productid") productid: string,
        @Body() body: ProductArt[],
        @Res() res?: HttpResponse,
    ) {
        if (!Array.isArray(body)) {
            res?.status(500).send({message: 'Invalid Request'});
            return null;
        }
        
        const cart = await this.cartService.findById(cartid);
        if (!cart) {
            res?.status(500).send({message: 'No se encontro el carrito'});
            return null;
        }

        const index = cart.productos?.findIndex(i => i?.id == productid);
        if (index < 0) {
            res?.status(500).send({message: 'El material no se encuentra asociado al carrito'});
            return null;
        }

        const arts: any[] = [];
        body.forEach(item => {
            item.archivo = item.archivo.replace(AppModule.URL, "{app}");
            delete item.modified;
            arts.push(item);
        });
        cart.productos[index].arts = arts;
        await this.cartService.update(toString(cart.id), cart);

        const resp = await this.cartService.getArts(cartid, productid);
        res?.status(200).send(resp);        
        return resp;
    }

    @Delete('delete-distribution/:cartid/:productid')
    @EndPointResponse({summary: 'Eliminar material de carrito.', operationId: 'eliminar-material' })
    async deleteProduct(
        @Param("cartid") cartId: string,
        @Param("productid") productId: string,
        @Req() req: HttpRequest,
        @Res() res?: HttpResponse,
    ) {
        const deleted = await this.cartService.deleteProducto(cartId, productId, req.user.username, false);
        if (!deleted) {
            return res?.status(500).send({message: 'No se permite eliminar materiales del carrito'});
        }
        return res?.status(200).send(await this.cartService.getCart(cartId));
    }

    @Get('regions/:regionid')
    @EndPointResponse({summary: 'Validar token enviado por la region.', operationId: 'validar-token' })
    async getRegions(
        @Param("regionid") id: string,
        @Res() res: HttpResponse,
    ) {
        this.regionService.findOne({id})
        .then(resp => {
            res.status(HttpStatus.OK).send(resp)
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error)
        })
    }

    @Post('finalizequotation/:cartid')
    @EndPointResponse({summary: 'Agrega un producto a un carrito', operationId: 'agregar-producto-a-carrito' })
    async finalizeQuotation(
        @Param("cartid") cartId: string, // id carrito
        @Query("productid") productId: string, // id producto
        @Query("onlysave") onlysave: boolean,
        @Body() body: Supplier[] | undefined,
        @Res() res?: HttpResponse,
    ) {
        if (!productId) {
            return this.cartService.finalizeQuotation(cartId)
            .then(resp => {
                res?.status(200).send(resp);
                return null;
            })
            .catch(error => {                
                res?.status(500).send(error);
                return null;
            })
        }

        return this.cartService.sendProductQuotitation(cartId, productId, body, onlysave)
        .then(resp => {
            res?.status(200).send(resp);
            return resp;
        })
        .catch(error => {
            res?.status(500).send(error);
            return null;
        })
    }    

    @Post('delete-product/:cartid/products/:productid')
    @EndPointResponse({summary: 'Envia propuesta de proveedores ganadores a TM.', operationId: 'enviar-propuesta-proveedores-carrito' })
    async deleteProducto(
        @Param("cartid") cartId: string,
        @Param("productid") productId: string,
        @Req() req: HttpRequest,
        @Res() res?: HttpResponse,
    ) {
        return this.cartService.deleteProducto(cartId, productId, req?.user?.username, true)
        .then(resp => {
            res?.status(HttpStatus.NO_CONTENT).send(resp)
            return resp;
        })
        .catch(_error => {
            res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message: "No se pudo eliminar el material"})
            return null;
        })
    }
}
