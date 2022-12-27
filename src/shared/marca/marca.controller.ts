 import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { MarcaService } from './marca.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { AppModule } from '../../app.module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('marca')
export class MarcaController {
    constructor(
        private marcaService: MarcaService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de canales', operationId: 'idioma' })
    async GetMarca(
        @Res() res: HttpResponse,
    ) {
        const items = await this.marcaService.findAll({});
        res.send(basicNormalizeItems(items));
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        const marca = await this.marcaService.findOne({id: id})
        if (marca?.image) marca.image = marca.image.replace('{app}',AppModule.URL)
        return res.send(marca);
    }
}
