import { Controller, Get, UseGuards, HttpStatus, Res, Req, Param, Put, Body, Query, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlanillaRecepcionBody, PlanillaRecepcionService } from './planillarecepcion.service';
import { ApiException, HttpRequest, HttpResponse } from '@proguidemc/http-module';
import { PlanillaRecepcionEstadoService } from './planillarecepcionestado.service';
import { responseDownload } from '../shared/utils/utils';

@ApiTags("Planillas de Recepcion")
@UseGuards(AuthGuard('jwt'))    
@Controller('planillarecepcion')
export class PlanillaRecepcionController {
    constructor(
        private planillaRecepcion: PlanillaRecepcionService,
        private planillaRecepcionEstado: PlanillaRecepcionEstadoService
    ) {}

    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest, 
    ) {
        res.send(await this.planillaRecepcion.test(req.user));
    }

    @Get('estados')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async getAllStates(
        @Res() res: HttpResponse,
    ) {
        this.planillaRecepcionEstado.findAll({})
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
    ) {
        this.planillaRecepcion.get(req?.user)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        }) 

    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async getOne(
        @Param("id") id: string,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        this.planillaRecepcion.get(req?.user, id)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        }) 

    }

    @Put('pallet-product/:id/:status')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async updatePalletProducts(
        @Body() body: PlanillaRecepcionBody[],
        @Param("status") status: 'pending' | 'ready',
        @Param("id") id: string,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        if (!Array.isArray(body)) body = [];
        this.planillaRecepcion.actualizarMaterialesPallet(req?.user, id, body, status)
        .then(resp => {
            res.status(204).send(resp);
        })
        .catch(error => {
            res.status(500).send(error);
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
        this.planillaRecepcion.print(req?.user, id, download)
        .then(file => {
            responseDownload(download, file, res);            
        })
        .catch(error => {
            res.status(500).send(error);    
        })        
    }

    @Post('reception/:id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async anull(
        @Param('id') id: string,
        @Res() res: HttpResponse,
    ) {
        this.planillaRecepcion.reception(id)
        .then(item => {
            res.status(204).send(item);
        })
        .catch(err => {
            res.status(500).send(err);
        })
    }
}
