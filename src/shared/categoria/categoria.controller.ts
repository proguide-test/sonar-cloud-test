import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { CategoriaService } from './categoria.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { AppModule } from '../../app.module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('categoria')
export class CategoriaController {
    
    constructor(private categoriaService: CategoriaService) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de categorías', operationId: 'categoria' })
    async GetCategoria(
        @Res() res: HttpResponse,
    ) {
        const items = await this.categoriaService.findAll({});
        res.send(basicNormalizeItems(items));
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        const categoria = await this.categoriaService.findOne({id: id})
        if (categoria?.image) categoria.image = categoria.image.replace('{app}',AppModule.URL)
        return res.send(categoria);
    }    
}
