import { Controller, Get, UseGuards, HttpStatus, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { TipoPService } from './tipop.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';

@UseGuards(AuthGuard('jwt'))    
@Controller('tipoprecio')
export class TipoPController {
    constructor(
        private tipopService: TipoPService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de canales', operationId: 'tipoprecio' })
    async GetTipoP(
        @Res() res: HttpResponse,
    ) {
        const tipoprecio = await this.tipopService.findAll({});
        res.send(tipoprecio);        
    }

}
