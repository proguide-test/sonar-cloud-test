import { Controller, Get, UseGuards, HttpStatus, Res, Req, Param, Query, Post, Body, Put, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlanillaDespachoService } from './planilladespacho.service';
import { ApiException, HttpRequest, HttpResponse } from '@proguidemc/http-module';
import { PlanillaDespachoCreate } from './model/planilladespacho.model';
import { PlanillaDespachoEstadoService } from './planilladespachoestado.service';
import { PlanillaDespachoEstadoEnum } from './model/planilladespachoestado.model';
import { errorFn, ORIGENID, responseDownload, toString } from '../shared/utils/utils';

@ApiTags("Planillas de Despacho")
@Controller('planilladespacho')
export class PlanillaDespachoController {
    constructor(
        private planillaDespacho: PlanillaDespachoService,
        private planillaDespachoEstado: PlanillaDespachoEstadoService
    ) {}

    @UseGuards(AuthGuard('jwt'))    
    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        const chofer = await this.planillaDespacho.choferService.findOne({});
        const vehiculo = await this.planillaDespacho.vehiculoService.findOne({});
        const operador = await this.planillaDespacho.operadorLogicoService.findOne({});
        const origenid = ORIGENID;
        if (chofer?.id && vehiculo?.id && operador?.id) {
            const pallet = await this.planillaDespacho.palletService.findOne({origenid});
            const pallets = [toString(pallet?.id)];

            const item = await this.insert({
                idchofer: chofer.id,
                idvehiculo: vehiculo.id,
                idoperador: operador.id,
                origenid,
                pallets: pallets,
                recepciones: [],
                usuario: req.user.username,
            }, req).catch(errorFn);

            if (item?.id) {
                await this.update({id: item.id, idoperador: operador.id}).catch(errorFn);
                await this.planillaDespacho.print(req.user, item.id, false).catch(errorFn);
                
                if (pallet?.id) {
                    await this.planillaDespacho.palletService.update(pallet.id, pallet);                    

                    const pallet1 = await this.planillaDespacho.palletService.findOne({_id: {$neq: pallet.id}, origenid});
                    const pallet1Id = toString(pallet1?.id);
                    await this.planillaDespacho.agregarPallets(item.id, [pallet1Id]).catch(errorFn);
                    await this.planillaDespacho.despachar(req.user, item.id, pallets, 'save').catch(errorFn);
                    await this.planillaDespacho.despachar(req.user, item.id, pallets.concat(pallet1Id), 'dispatch').catch(errorFn);
                }

                await this.planillaDespacho.anular(item.id).catch(errorFn);
            }
        }
        res.send({status: "OK"});
    }

    @UseGuards(AuthGuard('jwt'))    
    @Get('estados')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async getAllStates(
        @Res() res: HttpResponse,
        @Query('dispatch') dispatch: boolean,
    ) {
        const filter = dispatch ? {id: PlanillaDespachoEstadoEnum.Despachada} : {};
        this.planillaDespachoEstado.findAll(filter)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        }) 
    }

    @UseGuards(AuthGuard('jwt'))    
    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async getAll(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
        @Query('full') full: boolean,
        @Query('dispatch') dispatch: boolean,
    ) {
        const filter = dispatch ? {estado: PlanillaDespachoEstadoEnum.Despachada} : undefined;
        (full ? this.planillaDespacho.get(req?.user, '', filter) : this.planillaDespacho.findAll(filter || {}))
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        }) 
    }

    @UseGuards(AuthGuard('jwt'))    
    @Get(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException})
    async findById(
        @Param("id") id: string,
        @Query('full') full: boolean,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ) {
        (full ? this.planillaDespacho.get(req?.user, id) : this.planillaDespacho.findById(id))
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        }) 
    }

    @UseGuards(AuthGuard('jwt'))    
    @Get('print/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async print(
        @Param("id") id: string,
        @Query("download") download: boolean,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ){
        this.planillaDespacho.print(req?.user, id, download)
        .then(file => {
            responseDownload(download, file, res);            
        })
        .catch(error => {
            res.status(500).send(error);    
        })        
    }

    @UseGuards(AuthGuard('jwt'))    
    @Post('dispatch/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async despachar(
        @Query('save') save: boolean,
        @Param("id") idplanilla: string,
        @Body() body: string[],
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        this.planillaDespacho.despachar(req?.user, idplanilla, body, save ? 'save' : 'dispatch')
        .then(item => {
            res.status(204).send(item);
        })
        .catch(error => {
            res.status(500).send(error);
        })        
    }
    
    @UseGuards(AuthGuard('jwt'))    
    @Post('anular/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ApiException })
    async anular(
        @Param('id') idplanilla: string,
        @Res() res: HttpResponse,
    ) {
        this.planillaDespacho.anular(idplanilla)
        .then(item => {
            res.status(200).send(item);
        })
        .catch(error => {
            res.status(500).send(error);
        })        
    }

    @UseGuards(AuthGuard('jwt'))    
    @Post('')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async insert(
        @Body() body: PlanillaDespachoCreate,
        @Req() req: HttpRequest,
        @Res() res?: HttpResponse,
    ) {
        if (Object.keys(body).length <= 1) {
            res?.status(500).send({message: 'Invalid Request'});
            return null;
        }

        return this.planillaDespacho.insert(req.user, body || {})
        .then(item => {
            res?.status(200).send(item);
            return item;
        })
        .catch(error => {            
            res?.status(500).send(error);
            return null;
        })        
    }

    @UseGuards(AuthGuard('jwt'))    
    @Put('')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async update(
        @Body() body: any,
        @Res() res?: HttpResponse,
    ) {
        const id = body?.id;
        if (!id) {
            res?.status(500).send({message: 'No se encontro el ID a actualizar'});
            return null;
        }
        
        const item = await this.planillaDespacho.findOne({id}).catch(errorFn);
        if (!item) {
            res?.status(500).send({message: 'No se encontro el ID a actualizar'}); 
            return null;
        }
        
        return this.planillaDespacho.updateMany(body, {id})
        .then(resp => {
            res?.status(HttpStatus.OK).send(resp);
            return resp;
        })
        .catch(error => {
            res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            return null;
        })
    }

    @UseGuards(AuthGuard('jwt'))    
    @Delete(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async delete(
        @Param('id') id: string,
        @Res() res: HttpResponse
    ) {
        this.planillaDespacho.delete(id)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        }) 
    }

    @UseGuards(AuthGuard('jwt'))    
    @Put('add-pallets/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async addPallets(
        @Body() body: string[],
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        this.planillaDespacho.agregarPallets(id, body)
        .then(resp => {
            res.status(HttpStatus.NO_CONTENT).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        })        
    }
}
