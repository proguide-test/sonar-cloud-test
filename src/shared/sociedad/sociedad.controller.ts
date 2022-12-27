import { Controller, Get, UseGuards, HttpStatus, Res, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { SociedadService } from './sociedad.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('sociedad')
export class SociedadController {
  
    constructor(
        private sociedadService: SociedadService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de sociedades', operationId: 'sociedad' })
    async findAll(
        @Res() res: HttpResponse,
        @Query("combo") combo: boolean,
    ) {
        const items = await this.sociedadService.findAll({});
        res.send(basicNormalizeItems(items, combo));        
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.sociedadService.findOne({id: id}));        
    }
    
}
