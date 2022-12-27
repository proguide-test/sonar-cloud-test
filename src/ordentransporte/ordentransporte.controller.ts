import { Controller, Get, UseGuards, HttpStatus, Res, Req, Param, Query, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiException, formatDate, HttpRequest, HttpResponse } from '@proguidemc/http-module';
import { Product } from '../producto/model/producto.model';
import { LugarVM } from '../shared/lugar/model/lugar.model';
import { Plan } from '../shared/plan/model/plan.model';
import { arraySortedNumber, errorFn, toArray, toString, ORIGENID } from '../shared/utils/utils';
import { OrdenTransporteEstadoEnum } from './model/ordentransporteestado.model';
import { Prioridad } from './model/prioridad.model';
import { DeliveryGenerateTableInfo, OrdenTransporteService, OTCreateType, OTUpdateBody, OTUpdateBodyProducts } from './ordentransporte.service';
import { OrdenTransporteEstadoService } from './ordentransporteestado.service';

@ApiTags("Ordenes de Entrega")
@UseGuards(AuthGuard('jwt'))    
@Controller('ordentransporte')
export class OrdenTransporteController {

    constructor(private ordenTransporteService: OrdenTransporteService, private ordenTransporteEstadoService: OrdenTransporteEstadoService) { }

    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest, 
    ) {
        const origenid = ORIGENID;
        const planes: Plan[] = [];
        const lugares: LugarVM[] = [];
        const materiales: Product[] = [];
        const prioridades: Prioridad[] = [];
        
        await Promise.all([
            this.ordenTransporteService.planService.findAll({}),
            this.ordenTransporteService.userConfigService.getInfoEntities([], {id: "1"}),
            this.ordenTransporteService.palletService.productService.findAllTest(),
            this.ordenTransporteService.priorities(),
        ])
        .then(responses => {
            planes.push(...responses[0]);
            lugares.push(...responses[1]);
            materiales.push(...responses[2]);
            prioridades.push(...responses[3]);
        })
        .catch(errorFn);

        if (planes.length == 0 || lugares.length == 0 || materiales.length == 0) {
            return res.send({status: 'ERROR'});
        }

        const productId = toString(materiales[0]._id);
        const plan = toString(planes[0].id);
        const cliente = toString(lugares[0].id);
        const material = toString(materiales[0].codigotruck);
        const prioridadid = toString(prioridades[0].id);

        const ordenesPendientes = await this.ordenTransporteService.save('pending', [{
            plan,
            cliente,
            material,
            cantidad: '10',
            prioridadid,
            fechaproveedor: formatDate(undefined, 0, false, "-").substring(0, 10),
            nroordencompra: '1',
        }], req.user, origenid).catch(errorFn);
        
        if (Array.isArray(ordenesPendientes) && ordenesPendientes.length > 0) {
            const ordenId = toString(ordenesPendientes[0]._id);
            await this.ordenTransporteService.update(ordenId, {estado: OrdenTransporteEstadoEnum.Pendiente});
            await this.ordenTransporteService.closewithpendings(ordenId).catch(errorFn);
        }

        const ordenes = await this.ordenTransporteService.save('ready', [{
            plan,
            cliente,
            material,
            cantidad: '10',
            prioridadid,
            fechaproveedor: formatDate(undefined, 0, false, "-").substring(0, 10),
            nroordencompra: '1',
        }], req.user, origenid).catch(errorFn);
        
        if (Array.isArray(ordenes) && ordenes.length > 0) {
            const ordenId = toString(ordenes[0]._id);

            await this.ordenTransporteService.updateorder(ordenId, {
                productos: [{
                productoid: productId,
                newCantidades: 10,
                nroordencompra: '1',
            }], fechaproveedor: ''}).catch(errorFn);

            if (materiales.length > 1) {
                await this.ordenTransporteService.addProductos(ordenId, [{
                    productoid: toString(materiales[1]._id),
                    newCantidades: 20,
                    nroordencompra: '2',
                }]).catch(errorFn);
            }

            await this.ordenTransporteService.anull(ordenId).catch(errorFn);
        }
        
        res.send({status: "OK"});
    }
        
    @Get()
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async getAll(
        @Query("onlyPenAndGen") onlyPenAndGen: boolean,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ){
        try {
            res.status(200).send(await this.ordenTransporteService.getAll(req.user, false, {onlyPenAndGen}));
        } catch (err : any) {
            res.status(500).send({message: 'No se pudo obtener las ordenes'});
        }
    }
    
    @Get('priorities')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async prioridades(
        @Res() res: HttpResponse,
    ){
        this.ordenTransporteService.priorities()
        .then(resp => {
            res.status(200).send(resp);
        })
        .catch(error => {
            res.status(500).send(error);
        })
    }
    
    @Get('pending')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async getPendingOT(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ){
        try {
            res.status(200).send(
                await this.ordenTransporteService.getPendings(req.user)
            );
        } catch (err : any) {
            res.status(500).send({message: 'No se pudo obtener planes disponibles'});
        }
    }
   
    @Get('plans')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async getPlanes(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ){
        this.ordenTransporteService.getPlans(req?.user?.userId)
        .then(resp => {
            res.status(200).send(resp);
        })
        .catch(error => {
            res.status(500).send(error);
        })       
    }

    @Get('products')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async getProductos(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
        @Query('notin') notInOrderID: string,
        @Query('truckasid') truckAsId: boolean,
        @Query('count') count: boolean,
    ){
        this.ordenTransporteService.getProducts(req?.user?.userId, notInOrderID, count, truckAsId)
        .then(resp => {
            res.status(200).send(resp);
        })
        .catch(error => {
            res.status(500).send(error);
        })
    }

    @Get('targets')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async targets(
        @Query('recibede') recibede: string,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ){
        this.ordenTransporteService.targets(req?.user?.userId, undefined, recibede)
        .then(resp => {
            res.status(200).send(resp);
        })
        .catch(error => {
            res.status(500).send(error);
        })
    }

    @Post('create/:state')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async createOT(
        @Param('state') state: OTCreateType,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
        @Body() body: {items: DeliveryGenerateTableInfo[], origenid?: string},
    ){
        if (toArray(body.items).length == 0 || ['pending', 'ready'].indexOf(state) < 0) {
            return res.status(500).send({message: 'Invalid Request'});
        }

        this.ordenTransporteService.save(state, toArray(body.items), req?.user, body.origenid)
        .then(_resp => {
            res.status(204).send();
        })
        .catch(error => {
            res.status(500).send(error);
        })    
    }

    @Get('sources')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async sources(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ){
        this.ordenTransporteService.sources(req.user.userId)
        .then(resp => {
            res.status(200).send(resp);
        })
        .catch(error => {
            res.status(500).send(error?.message ? error : {message: 'No se pudo obtener origenes'});
        })
    }

    @Get('states')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async states(
        @Res() res: HttpResponse,        
    ){
        this.ordenTransporteEstadoService.findAll({enabled: true})
        .then(resp => {
            res.status(200).send(arraySortedNumber(resp, "orden"));
        })
        .catch(error => {
            res.status(500).send(error);
        })
    }

    @Get(":id")
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async getOne(
        @Param("id") id: string,
        @Query("includestock") includestock: boolean,
        @Query("includetruck") includetruck: boolean,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ){
        if (!id) return res.status(500).send({message: 'Verifique el id de orden'});
        
        const item = await this.ordenTransporteService.getId(req.user, id, includestock, includetruck);
        if (!item) return res.status(500).send({message: 'Error al obtener la orden'});
        
        return res.status(200).send(item);
    }

    @Post('anull/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async anull(
        @Param('id') id: string,
        @Res() res: HttpResponse,
    ) {
        this.ordenTransporteService.anull(id).then(item => {
            res.status(204).send(item);
        }).catch(err => {
            res.status(500).send(err);
        })    
    }

    @Post('closewithpendings/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async closewithpendings(
        @Param('id') id: string,
        @Res() res: HttpResponse,
    ) {
        this.ordenTransporteService.closewithpendings(id)
        .then(item => {
            res.status(204).send(item);
        }).catch(err => {
            res.status(500).send(err);
        })
    }

    @Post('update/add/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async addproductsorder(
        @Param('id') id: string,
        @Body() body: OTUpdateBodyProducts[],
        @Res() res: HttpResponse,
    ) {
        this.ordenTransporteService.addProductos(id, body).then(response => {
            res.status(200).send({ message: response})
        }).catch(err => {
            res.status(500).send(err)
        })
    }   

    @Post('update/modify/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async updateorder(
        @Param('id') id: string,
        @Body() body: OTUpdateBody,
        @Res() res: HttpResponse,
    ) {
        this.ordenTransporteService.updateorder(id, body).then(response => {
            res.status(200).send({ message: response})
        }).catch(err => {
            res.status(500).send(err)
        });
    }   
}