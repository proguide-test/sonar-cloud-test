import { Controller, Get, UseGuards, HttpStatus, Res, Query, Body, Put, Delete, Param, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '@nestjs/swagger';
import { VehiculoService } from './vehiculo.service';
import { ApiException, HttpResponse, parseNumber } from '@proguidemc/http-module';
import { SubtipoCamionEnum, TipoVehiculoEnum, Vehiculo } from './model/vehiculo.model';
import { errorFn, toString } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('vehiculo')
export class VehiculoController {
    constructor(
        private vehiculoService: VehiculoService
    ) { }

    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
    ) {
        const vehiculo: Vehiculo = {
            id: 'test',
            patente: 'test',
            tipovehiculo: TipoVehiculoEnum.camion,
            posiciones: 20,
            empresa: 'test',
            subtipo: SubtipoCamionEnum.lechero,
        }
        const insVehiculo = await this.insert(vehiculo).catch(errorFn);
        if (insVehiculo) {
            await this.findById(toString(insVehiculo._id)).catch(errorFn);
            await this.update({patente: 'Test actualizado', id: 'test'}).catch(errorFn);
            await this.update({patente: 'Test actualizado', id: 'test1'}).catch(errorFn);
        }
        res.send({status: "OK"});
    }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async getAll(
        @Res() res: HttpResponse,
        @Query('tipovehiculo') tipovehiculo: TipoVehiculoEnum,
    ) {
        res.status(HttpStatus.OK).send(await this.vehiculoService.getVehicle(tipovehiculo));
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException})
    async findById(
        @Param('id') id: string,
        @Res() res?: HttpResponse,
    ) {
        return this.vehiculoService.findById(id)
        .then(resp => {
            if (resp) {
                res?.status(HttpStatus.OK).send(this.vehiculoService.normalize([resp])[0]);
            } else {
                res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message: "No se encontro el chofer"});
            }
            return resp;
        });
    }
    
    @Post('')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async insert(
        @Body() body: Vehiculo,
        @Res() res?: HttpResponse,
    ) {
        if (Object.keys(body).length <= 1) {
            res?.status(500).send({message: 'Invalid request'});
            return null;
        }
        const vehiculo = await this.vehiculoService.findOne({patente: body.patente});
        if(vehiculo) {
            res?.status(HttpStatus.NOT_ACCEPTABLE).send({message: "Ya existe un camión para la patente ingresada"});
            return vehiculo;
        }
        
        body.id = toString(parseNumber(this.vehiculoService.maxInArray(await this.vehiculoService.findAll({}), "id", true)) + 1);
        return this.vehiculoService.create(body)
        .then(resp => {
            if (resp) {
                res?.status(HttpStatus.OK).send(this.vehiculoService.normalize([resp])[0]);
            } else {
                res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message: "No se pudo insertar el vehiculo"});
            }
            return resp;
        });
    }

    @Put('')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async update(
        @Body() body: any,
        @Res() res?: HttpResponse,
    ) {
        const id = body?.id;
        if (!id) {
            res?.status(500).send({message: 'Invalid request'});
            return null;
        }
               
        const item = await this.vehiculoService.findOne({id});
        if (!item) {
            res?.status(500).send({message: 'No se encontro el ID a actualizar'}); 
            return null;
        }
        if (body.patente != item.patente) {
            const vehiculo = await this.vehiculoService.findOne({patente: body.patente});
            if(vehiculo) {
                res?.status(HttpStatus.NOT_ACCEPTABLE).send({message: "Ya existe un camión para la patente ingresada"});
                return vehiculo;
            }
        }
        return this.vehiculoService.updateMany(body, {id})
        .then(resp => {
            if (resp) {
                res?.status(HttpStatus.OK).send(resp);
            } else {
                res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message: "No se pudo actualizar el vehiculo"});
            }
            return resp;
        });
    }
    
    @Delete(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async delete(
        @Param('id') id: string,
        @Res() res: HttpResponse
    ) {
        res.status(HttpStatus.OK).send(await this.vehiculoService.deleteMany({id}));
    }

}
