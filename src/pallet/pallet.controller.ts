import { Controller, Get, UseGuards, HttpStatus, Res, Req, Param, Body, Put, Delete, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { PalletService, PalletUpdateBody } from './pallet.service';
import { ApiException, HttpRequest, HttpResponse } from '@proguidemc/http-module';
import { ProductoPalletRequest } from './model/pallet.model';
import { PalletEstadoService } from './palletestado.service';
import { errorFn, responseDownload, toString } from '../shared/utils/utils';

@ApiTags("Pallets")
@UseGuards(AuthGuard('jwt'))    
@Controller('pallet')
export class PalletController {
    constructor(
        private palletService: PalletService,
        private palletEstadoService: PalletEstadoService
    ) { }

    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest, 
    ) {
        const orden = await this.palletService.ordenTransporteService.getOrdenTest('pallet', req.user).catch(errorFn);
        const ordenId = toString(orden?._id);
        const productoId = toString(orden?.productos[0].productoid);
        const productoId1 = toString(orden?.productos[1].productoid);
        if (!productoId1) return res.send({status: "ERROR"});

        const pallet = await this.palletService.insert(req.user, [{
            cantidad: 10,
            ordentransporteid: ordenId,
            productoid: productoId,
            cantidadrecibida: 10,            
        }], false, 'P70').catch(errorFn);

        const palletId = toString(pallet?._id);
        if (palletId) {
            await this.palletService.get(req.user, false, palletId, true).catch(errorFn);

            await this.updatePallet(palletId, [{
                newCantidad: 20,
                ordentransporteid: ordenId,
                productoid: productoId,                
            }]).catch(errorFn);

            await this.updatePallet(palletId, [{
                newCantidad: 10,
                ordentransporteid: ordenId,
                productoid: productoId1,                
            }]).catch(errorFn);

            await this.updatePallet(palletId, [{
                newCantidad: 10,
                ordentransporteid: ordenId,
                productoid: productoId1,   
                deleted: true             
            }]).catch(errorFn);
        
            await this.print(palletId, true, req).catch(errorFn);

            await this.addProducts(palletId, [{
                cantidad: 5,
                ordentransporteid: ordenId,
                productoid: productoId1
            }]).catch(errorFn);

            await this.anularPallet({id: palletId}, req).catch(errorFn);

            await this.getOrders(palletId, false, req).catch(errorFn);
        }

        res.send({status: "OK"});
    }
    
    @Get('print/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async print(
        @Param("id") id: string,
        @Query("download") download: boolean,
        @Req() req: HttpRequest,
        @Res() res?: HttpResponse,        
    ){
        return this.palletService.print(req?.user, id, download)
        .then(file => {
            res && responseDownload(download, file, res);
            return file;
        })
        .catch(error => {
            res?.status(500).send(error);
            return null;
        })        
    }

    @Get('estados')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async getAllStates(
        @Res() res: HttpResponse,
    ) {
        this.palletEstadoService.findAll({})
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        }) 
    }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async getAll(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
        @Query('onlyunassigned') unassigned: boolean,
        @Query('count') count: boolean,
    ) {
        this.palletService.get(req.user, unassigned, undefined, undefined, count)
        .then(resp => {
            res.status(200).send(resp);    
        })
        .catch(error => {
            res.status(500).send(error);    
        });
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException})
    async findById(
        @Param("id") id: string,
        @Query("includestock") includestock: boolean,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        this.palletService.get(req.user,false, id, includestock)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        })
    }

    @Put('/update/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async updatePallet(
        @Param("id") id: string,
        @Body() body: PalletUpdateBody[],
        @Res() res?: HttpResponse,
    ) {
        if (!Array.isArray(body)) body = [];
        return this.palletService.updateProducts(id, body)
        .then(resp => {            
            res?.status(HttpStatus.OK).send(resp);
            return resp;
        })
        .catch(error => {
            res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            return null;
        }) 
    }

    @Put('/anular')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async anularPallet(
        @Body() body: {
            id: string, 
        },
        @Req() req: HttpRequest,
        @Res() res?: HttpResponse,
    ) {
        if (!body?.id) {
            res?.status(500).send({message: 'No se encontro el ID a actualizar'});
            return null;
        }

        return this.palletService.anularPallet(body.id, req.user.userId)
        .then(resp => {
            res?.status(HttpStatus.OK).send(resp);
            return resp;
        })
        .catch(error => {
            res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            return null;
        }) 
    }

    @Delete(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async delete(
        @Param('id') id: string,
        @Res() res?: HttpResponse
    ) {
        return this.palletService.delete(id)
        .then(resp => {
            res?.status(HttpStatus.OK).send(resp);
            return resp;
        })
        .catch(error => {
            res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            return null;
        }) 
    }
    
    @Put('add-products/:id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async addProducts(
        @Param("id") id: string,
        @Body() body: ProductoPalletRequest[],
        @Res() res?: HttpResponse
    ) {
        if (!Array.isArray(body)) body = [];
        return this.palletService.addProducts(id, body)
        .then(resp => {
            res?.status(HttpStatus.OK).send(resp);
            return resp;
        })
        .catch(error => {
            res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            return null;
        }) 
    }
    
    @Get('ordenestransporte/:id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async getOrders(
        @Param('id') id: string,
        @Query('count') count: boolean,
        @Req() req: HttpRequest,
        @Res() res?: HttpResponse
    ) {
        return this.palletService.getOrders(req?.user, id, count)
        .then(resp => {
            res?.status(HttpStatus.OK).send(resp);
            return resp;
        })
        .catch(error => {
            res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            return null;
        }) 
    }

}
