import { Controller, Get, UseGuards, HttpStatus, Res, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AlmacenService } from './almacen.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('almacen')
export class AlmacenController {
    constructor(
        private almacenService: AlmacenService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de almacenes', operationId: 'almacen' })
    async GetAlmacen(
        @Res() res: HttpResponse,
        @Query("centroid") centroid: string,
    ) {
        const items = await this.almacenService.findAll(centroid ? {centroid} : {});
        res.send(basicNormalizeItems(items));        
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        const categoria = await this.almacenService.findById(id)
        return res.send(categoria);
    }
    
}
