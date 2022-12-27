import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { VendedorService } from './vendedor.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('vendedor')
export class VendedorController {
    
    constructor(
        private vendedorService: VendedorService,
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de vendedores', operationId: 'vendedor' })
    async GetCanal(
        @Res() res: HttpResponse,
    ) {
        const items = await this.vendedorService.findAll({});
        res.send(basicNormalizeItems(items));        
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException})
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse
    ) {
        res.send(await this.vendedorService.findOne({id}));        
    }

}