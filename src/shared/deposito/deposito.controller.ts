import { Controller, Get, UseGuards, HttpStatus, Res, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { DepositoService } from './deposito.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('deposito')
export class DepositoController {
    
    constructor(
        private depositoService: DepositoService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de depositos', operationId: 'idioma' })
    async findAll(
        @Res() res: HttpResponse,
        @Query('regionid') regionid: string
    ) {
        let items = [];
        if (regionid) items = await this.depositoService.findAll({regionid: regionid});
        else items = await this.depositoService.findAll({});
        res.send(basicNormalizeItems(items));                
    }
    
    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.depositoService.findById(id));        
    }
}
