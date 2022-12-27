import { Controller, Get, UseGuards, HttpStatus, Res, Param, Post, Body, Put, Delete, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { PuntoDeVentaService } from './puntodeventa.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { PuntoDeVenta } from './model/puntodeventa.model';

@UseGuards(AuthGuard('jwt'))    
@Controller('puntodeventa')
export class PuntoDeVentaController {
    
    constructor(
        private puntoDeVentaService: PuntoDeVentaService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de puntos de venta', operationId: 'puntodeventa' })
    async findAll(
        @Res() res: HttpResponse,
        @Query("regionid") regionid: string,
    ) {
        let pdv = [] 
        if (regionid) pdv = await this.puntoDeVentaService.findAll({regionid});
        else pdv = await this.puntoDeVentaService.findAll({});
        res.send(pdv);        
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.puntoDeVentaService.findOne({id: id}));        
    }
    
    @Post('')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async insert(
        @Body() body: PuntoDeVenta,
        @Res() res: HttpResponse,
    ) {
        if (!body?.name || !body?.regionid) return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message: "Invalid Request"});        
        res.send(await this.puntoDeVentaService.create(body));        
    }

    @Put('')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async update(
        @Body() body: any,
        @Res() res: HttpResponse,
    ) {
        const id = body?.id;
        if (!id) return res.status(500).send({message: 'No se encontro el ID a actualizar'});
        return res.send(await this.puntoDeVentaService.updateMany(body, {id}));    
    }

    @Delete(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async deletePrueba(
        @Param('id') id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.puntoDeVentaService.delete(id));        
    }

}
