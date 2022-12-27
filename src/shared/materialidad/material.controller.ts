import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { MaterialService } from './material.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))
@Controller('materialidad')
export class MaterialController {
    
    constructor(
        private materialService: MaterialService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de materialidad', operationId: 'new-product' })
    async GetMaterial(
        @Res() res: HttpResponse,
    ) {
        const items = await this.materialService.findAll({});
        res.send(basicNormalizeItems(items));        
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.materialService.findOne({id: id}));        
    }

}
