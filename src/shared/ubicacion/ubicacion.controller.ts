import { Controller, Get, UseGuards, HttpStatus, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { UbicacionService } from './ubicacion.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';

@UseGuards(AuthGuard('jwt'))    
@Controller('ubicacion')
export class UbicacionController {
    
    constructor(
        private ubicacionService: UbicacionService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de canales', operationId: 'canal' })
    async GetUbicacion(
        @Res() res: HttpResponse,
    ) {
        const ubicacion = await this.ubicacionService.findAll({});
        res.send(ubicacion);        
    }

}
