import { Controller, Get, UseGuards, HttpStatus, Res, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { CentroService } from './centro.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('centro')
export class CentroController {
    
    constructor(
        private centroService: CentroService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de centros', operationId: 'centro' })
    async findAll(
        @Res() res: HttpResponse,
        @Query("combo") combo: boolean,
        @Query('sociedadid') sociedadid: string,
    ) {
        const items = await this.centroService.findAll(sociedadid ? {sociedadid} : {});            
        res.send(basicNormalizeItems(items, combo));        
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.centroService.findOne({id: id}));        
    }
}
