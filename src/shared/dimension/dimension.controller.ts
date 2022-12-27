import { Controller, Get, UseGuards, HttpStatus, Res, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { DimensionService } from './dimension.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { BasicInfo, basicNormalizeItems, toString } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('dimension')
export class DimensionController {
    
    constructor(
        private dimensionService: DimensionService
    ) { }

    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,     
    ) {
        await this.findAll("test", true);
        await this.findAll("", false, res);
    }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de dimensiones', operationId: 'dimension' })
    async findAll(
        @Query('type') type: string,      
        @Query('name') name: boolean,
        @Res() res?: HttpResponse,
    ): Promise<BasicInfo[]> {
        let items = [] 
        if (type) items = await this.dimensionService.findAll({type});
        else items = await this.dimensionService.findAll({});
        items = basicNormalizeItems(items);
        if (!name) items.forEach((item) => item.name = toString(item.id));
        res?.send(items);    
        return items;
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.dimensionService.findOne({id: id}));
    }

}
