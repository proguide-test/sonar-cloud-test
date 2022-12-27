import { Controller, Get, UseGuards, HttpStatus, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { IdiomaService } from './idioma.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';

@UseGuards(AuthGuard('jwt'))    
@Controller('idioma')
export class IdiomaController {
    
    constructor(
        private idiomaService: IdiomaService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de canales', operationId: 'idioma' })
    async GetIdioma(
        @Res() res: HttpResponse,
    ) {
        const idioma = await this.idiomaService.findAll({});
        res.send(idioma);
    }

}
