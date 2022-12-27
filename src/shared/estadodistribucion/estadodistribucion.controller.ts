import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { EstadoDistribucionService } from './estadodistribucion.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';

@UseGuards(AuthGuard('jwt'))    
@Controller('estadodistribucion')
export class EstadoDistribucionController {

    constructor(
        private estadoDistribucionService: EstadoDistribucionService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de estados de distribucion', operationId: 'estado-de-distribucion' })
    async findAll(
        @Res() res: HttpResponse,
    ) {
        res.send(await this.estadoDistribucionService.findAll({}));        
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.estadoDistribucionService.findOne({id}));        
    }
}
