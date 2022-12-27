import { Controller, Get, Post, HttpStatus, Res, Param } from '@nestjs/common';
import { ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { CartService } from './cart.service';
import { OrdenCompraEstadoEnum } from '../../upload/templates/ordencompra/model/ordencompraestado.model';

@ApiTags("Simulador")
@Controller('simulador')
export class SimuladorController {
    constructor(
        private cartService: CartService,
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de OCs', operationId: 'lista-ocs' })
    async GetAll(
        @Res() res: HttpResponse,
    ) {
        this.cartService.ordenCompraService.getAll()
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        })
    }

    @Get('estados')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de OCs', operationId: 'lista-ocs' })
    async GetEstados(
        @Res() res: HttpResponse,
    ) {
        this.cartService.ordenCompraService.ordenCompraEstadoService.findAll({})
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        })
    }
    
    
    @Post('delete/:id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async delete(
        @Param("id") ocid: string,
        @Res() res: HttpResponse,
    ) {
        this.cartService.ordenCompraService.generarOEs(ocid, 0, true)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        })
    }

    @Post('generate/:id/:count')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async generate(
        @Param("id") ocid: string,
        @Param("count") count: number,
        @Res() res: HttpResponse,
    ) {
        this.cartService.ordenCompraService.generarOEs(ocid, count)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        })
    }

    @Post(':id/:estado')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Cambiar estado de OC', operationId: 'status-oc' })
    async sendQuotation(
        @Param("id") id: string,
        @Param("estado") estado: OrdenCompraEstadoEnum,
        @Res() res: HttpResponse,
    ) {
        const estados = await this.cartService.ordenCompraService.ordenCompraEstadoService.findAll({});
        if (!Array.isArray(estados) || !estados.some(i => i.id == estado)) return res.status(500).send({message: 'No existe el estado'});

        const item = await this.cartService.ordenCompraService.getFromId(id);
        if (!item?.estado?.id) return res.status(500).send({message: 'No existe la orden de compra'});
        
        if (item.estado.id == estado) return res.status(500).send({message: 'El estado ingresado es el mismo que el estado actual'});

        const resp = await this.cartService.ordenCompraService.update(id, {estado});
        if (!resp)  return res.status(500).send({message: 'No se pudo actualizar el estado de la orden de compra'});
        res.status(204).send();
    }
}
