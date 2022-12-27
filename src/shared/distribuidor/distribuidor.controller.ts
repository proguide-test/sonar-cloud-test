import { Controller, Get, UseGuards, HttpStatus, Res, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { DistribuidorService } from './distribuidor.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';

@UseGuards(AuthGuard('jwt'))    
@Controller('distribuidor')
export class DistribuidorController {

    constructor(
        private distribuidorService: DistribuidorService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de distribuidor', operationId: 'distribuidor' })
    async findAll(
        @Res() res: HttpResponse,
        @Query("regionid") regionid: string,
    ) {
        let distribuidores = [] 
        if (regionid) distribuidores = await this.distribuidorService.findAll({regionid});
        else distribuidores = await this.distribuidorService.findAll({});
        res.send(distribuidores);
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.distribuidorService.findById(id));        
    }
}
