import { Controller, Get, UseGuards, HttpStatus, Res, Req, Param, Post, Body, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LiquidacionService } from './liquidacion.service';
import { ApiException, HttpRequest, HttpResponse } from '@proguidemc/http-module';
import { errorFn, toString } from '../shared/utils/utils';

@ApiTags("Liquidacion")
@UseGuards(AuthGuard('jwt'))    
@Controller('liquidacion')
export class LiquidacionController {
    constructor(
        private liquidacionService: LiquidacionService
    ) { }

    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest, 
    ) {
        const from = '2022-01-01'; 
        const to = '2022-02-01';
        const items = await this.liquidacionService.planillaRecepcionService.findAll({liquidacionid: {$in: [null, ""]}});
        const recepciones = items.filter((_i, index) => index < 3).map(i => toString(i._id));
        await this.liquidacionService.generate(req.user, recepciones, from, to).catch(errorFn);
        await this.liquidacionService.planillaRecepcionService.updateMany({liquidacionid: ""}, {_id: recepciones}).catch(errorFn);
        await this.liquidacionService.get(req.user, "", "", undefined, true).catch(errorFn);
        res.send({status: 'OK'});
    }

    @Get('/planillasaliquidar')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: `GET All TO LIQUIDATE`, operationId: 'getToLiquidate' })
    async GetParaLiquidar(
        @Query("from") from: string,
        @Query("to") to: string,
        @Res() res: HttpResponse,
    ) {
        this.liquidacionService.getPlanillasLiquidables(from, to)
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
    @ApiOperation({ summary: `GET All`, operationId: 'liquidacion' })
    async find(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
        @Query("full") full: boolean,
        @Query("from") from: string,
        @Query("to") to: string,
        @Query("id") id: string,
    ) {
        this.liquidacionService.get(req?.user, from, to, id, full)
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
    @ApiOperation({ summary: 'GET One', operationId: 'liquidacion' })
    async finOne(
        @Param('id') id: string,
        @Query('full') full: boolean,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,        
    ) {        
        (full ? this.liquidacionService.get(req?.user, undefined, undefined, id, full) : this.liquidacionService.findById(id))
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        });
    }

    @Post('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'POST', operationId: 'liquidacion' })
    async gen(
        @Body() body: {recepciones: string[], from: string, to: string},
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        this.liquidacionService.generate(req.user, body.recepciones, body.from, body.to)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        })
    }
}
