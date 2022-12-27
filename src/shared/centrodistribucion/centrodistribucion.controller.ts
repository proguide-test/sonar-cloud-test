import { Controller, Get, UseGuards, HttpStatus, Res, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { CentroDistribucionService } from './centrodistribucion.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('centrodistribucion')
export class CentroDistribucionController {

    constructor(
        private centroDistribucionService: CentroDistribucionService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de canales', operationId: 'idioma' })
    async findAll(
        @Res() res: HttpResponse,
        @Query('regionid') regionid: string
    ) {
        let items = [];
        if (regionid) 
            items = await this.centroDistribucionService.findAll({regionid: regionid});
        else 
            items = await this.centroDistribucionService.findAll({});

        res.send(basicNormalizeItems(items));    
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.centroDistribucionService.findById(id));        
    }    
}
