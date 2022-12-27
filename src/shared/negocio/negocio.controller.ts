import { Controller, Get, UseGuards, HttpStatus, Res, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '@nestjs/swagger';
import { NegocioService } from './negocio.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { Negocio } from './model/negocio.model';

@UseGuards(AuthGuard('jwt'))    
@Controller('negocio')
export class NegocioController {
    
    constructor(
        private negocioService: NegocioService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async GetNegocio(
        @Res() res: HttpResponse,
    ) {
        const items = await this.negocioService.findAll({});
        res.send(items);        
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        const categoria = await this.negocioService.findById(id)
        return res.send(categoria);        
    }
    
    @Post('')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async insert(
        @Body() body: Negocio,
        @Res() res: HttpResponse,
    ) {
        if (!body?.name) return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message: "Invalid Request"});
        return res.send(await this.negocioService.create(body));        
    }

    @Put('')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async update(
        @Body() body: any,
        @Res() res: HttpResponse,
    ) {
        const id = body?._id;
        if (!id) return res.status(500).send({message: 'No se encontro el negocio a actualizar'});
        return res.send(await this.negocioService.update(id, body));    
    }

    @Delete(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async deletePrueba(
        @Param('id') id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.negocioService.delete(id));        
    }

}
