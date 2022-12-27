import { Controller, Get, UseGuards, HttpStatus, Res, Req, Param, Query, Post, Body, Put, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlanillaService } from './planilla.service';
import { ApiException, HttpRequest, HttpResponse } from '@proguidemc/http-module';
import { PlanillaEstadoService } from './planillaestado.service';
import { ProductoPallet } from '../pallet/model/pallet.model';
import { responseDownload } from '../shared/utils/utils';

@ApiTags("Planillas de Armado")
@UseGuards(AuthGuard('jwt'))    
@Controller('planillaarmado')
export class PlanillaController {
    constructor(
        private planillaService: PlanillaService,
        private planillaEstadoService: PlanillaEstadoService
    ) { }

    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest, 
    ) {        
        res.send(await this.planillaService.test(req.user));
    }

    @Get('estados')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async getAllStates(
        @Res() res: HttpResponse,
    ) {
        this.planillaEstadoService.findAll({})
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        }) 
    }

    @Get('usuarios')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException})
    async findUsers(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ) {
        this.planillaService.getUsers(req?.user)
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
        @Query('full') full: boolean,
    ) {
        this.planillaService.get('', req.user, full, false, false)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        }) 
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException})
    async findById(
        @Param("id") id: string,
        @Query('excludeemptys') excludeemptys: boolean,
        @Query('full') full: boolean,
        @Query('includestock') includestock: boolean,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ) {
        this.planillaService.get(id, req.user, full, excludeemptys, includestock)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        }) 
    }

    @Post('paletizar/:type/:idplanilla')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async paletizar(
        @Query('chep') chep: boolean,
        @Param('idplanilla') idplanilla: string,
        @Param('type') type: 'ready' | 'pending',
        @Body() body: ProductoPallet[],
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        if (!Array.isArray(body)) body = [];
        this.planillaService.paletizar(req.user, idplanilla, body, chep, type)
        .then(response => {
            res.status(200).send(response);
        })
        .catch(error => {
            res.status(500).send(error);
        })
    }

    @Post('')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async insert(
        @Body() body: string[],
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        if (!Array.isArray(body)) body = [];
        this.planillaService.insert(body, req.user)
        .then(item => {
            res.status(200).send(item);
        })
        .catch(error => {
            res.status(500).send(error);
        })
    }

    @Put('')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async update(
        @Body() body: any,
        @Res() res: HttpResponse,
    ) {
        const id = body?.id;
        if (!id) return res.status(500).send({message: 'No se encontro el ID a actualizar'});
        
        const item = await this.planillaService.findOne({id});
        if (!item) return res.status(500).send({message: 'No se encontro el ID a actualizar'}); 
        
        return res.send(await this.planillaService.updateMany(body, {id}));
    }

    @Delete(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async delete(
        @Param('id') id: string,
        @Res() res: HttpResponse
    ) {
        this.planillaService.delete(id)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        }) 
    }

    @Get('print/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async print(
        @Param("id") id: string,
        @Query("download") download: boolean,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ){
        this.planillaService.print(req?.user, id, download)
        .then(file => {
            responseDownload(download, file, res);            
        })
        .catch(error => {
            res.status(500).send(error);    
        })
    }

    @Post('finalizarpalletizado/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async finalized(
        @Param("id") id: string,
        @Body() body: ProductoPallet[],
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ){
        this.planillaService.finalized(id, body, req.user)
        .then(resp => {
            res.status(200).send({...resp, message: "Paletizado finalizado" });
        }).catch(err => {
            res.status(500).send({message: err.message});
        })    
    }

    @Post('anular/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async anular(
        @Param("id") id: string,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ){
        this.planillaService.anular(id, req.user.userId)
        .then(_item => {
            return res.status(200).send({ message: "Anulado completo" })
        }).catch(err => {
            res.status(500).send({ message: err.message })
        })    
    }
}
