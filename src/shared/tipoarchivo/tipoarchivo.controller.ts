import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { TipoAService } from './tipoarchivo.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('tipoarchivo')
export class TipoAController {
    
    constructor(
        private tipoaService: TipoAService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de archivos', operationId: 'tipoarchivos' })
    async GetTipoM(
        @Res() res: HttpResponse,
    ) {
        const items = await this.tipoaService.findAll({});
        res.send(basicNormalizeItems(items));                    
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.tipoaService.findOne({id: id}));        
    }
}

