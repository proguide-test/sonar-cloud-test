import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { EstrategiaService } from './estrategia.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('estrategia')
export class EstrategiaController {
    
    constructor(
        private estrategiaService: EstrategiaService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de estrategias', operationId: 'estrategia' })
    async findAll(
        @Res() res: HttpResponse,
    ) {
        const items = await this.estrategiaService.findAll({});
        res.send(basicNormalizeItems(items));        
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.estrategiaService.findOne({id: id}));        
    }
    
}
