import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { OrdenEntregaMotivoService } from './ordenentregamotivo.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('ordenentregamotivo')
export class OrdenEntregaMotivoController {
    
    constructor(
        private ordenEntregaMotivoService: OrdenEntregaMotivoService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de motivos de diferencia', operationId: 'motivos-de-diferencia' })
    async GetAlmacen(
        @Res() res: HttpResponse,
    ) {
        const items = await this.ordenEntregaMotivoService.findAll({});
        res.send(basicNormalizeItems(items));
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        const categoria = await this.ordenEntregaMotivoService.findById(id)
        return res.send(categoria);
    }

}
