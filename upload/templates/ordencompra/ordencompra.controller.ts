import { Controller, Get, UseGuards, HttpStatus, Res, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdenCompraService } from './ordencompra.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';

@ApiTags("Ordenes de Compra")
@Controller('ordencompra')
export class OrdenCompraController {
    constructor(private ordenCompraService: OrdenCompraService) { }

    @Get('generate/:ocid/:count')
    async generateOEs(
        @Res() res: HttpResponse,
        @Param("ocid") ocid: string,
        @Param("count") count: number,
    ) {
        this.ordenCompraService.generarOEs(ocid, count)
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        });
    }

    @Get('/estados')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findEstados(
        @Res() res: HttpResponse,
    ) {
        this.ordenCompraService.ordenCompraEstadoService.findAll({})
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
    @ApiOperation({ summary: 'Obtener lista de ordenes de compra de un carrito', operationId: 'ordenes-compra' })
    async GetOrdenesCompra(
        @Res() res: HttpResponse,
        @Query("supplierid") supplierid: string,
        @Query("cartid") cartid: string,
    ) {
        if (!cartid && !supplierid) return res.status(500).send({message: 'Verifique el id de carrito'});
        (supplierid ? this.ordenCompraService.getFromSupplierId(supplierid) : this.ordenCompraService.getFromCartId(cartid))
        .then(resp => {
            res.status(HttpStatus.OK).send(resp);
        })
        .catch(error => {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
        }) 
    }

    @UseGuards(AuthGuard('jwt'))    
    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Query("full") full: boolean,
        @Query("type") type: 'with-oe' | 'with-available',
        @Res() res: HttpResponse,
    ) {
        if (full || type == "with-oe") {
            this.ordenCompraService.getFromIdWithOEs(id)
            .then(resp => {
                res.status(HttpStatus.OK).send(resp);
            })
            .catch(error => {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            }) 
        } else if (type == "with-available") {
            this.ordenCompraService.getFromIdWithAvailableCounts(id)
            .then(resp => {
                res.status(HttpStatus.OK).send(resp);
            })
            .catch(error => {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            }) 
        } else {
            this.ordenCompraService.getFromId(id)
            .then(resp => {
                res.status(HttpStatus.OK).send(resp);
            })
            .catch(error => {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            }) 
        }
    }

}
