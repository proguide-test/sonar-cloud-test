import { Controller, Get, UseGuards, HttpStatus, Res, Req, Param, Query, Post, Body, Put, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '@nestjs/swagger';
import { ChoferService } from './chofer.service';
import { ApiException, HttpRequest, HttpResponse, parseNumber } from '@proguidemc/http-module';
import { convertImages, errorFn, toString, uploadFile } from '../utils/utils';
import { Chofer } from './model/chofer.model';

@UseGuards(AuthGuard('jwt'))
@Controller('chofer')
export class ChoferController {
    constructor(
        private choferService: ChoferService,
    ) { }
    
    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
    ) {
        const chofer = await this.insert({
            apellido: 'test',
            dni: 'test',
            id: 'test',
            nombre: 'test',
            tipocarnet: "C",
        }).catch(errorFn);

        if (chofer) {
            await this.findById(toString(chofer._id)).catch(errorFn);
            await this.update({dni: 'Test actualizado', id: 'test'}).catch(errorFn);
            await this.update({dni: 'Test actualizado', id: 'test1'}).catch(errorFn);
        }
        res.send({status: "OK"});
    }

    @Post('images')
    async uploadImages(
        @Query("maxsize") size: number,
        @Query("withname") withname: string,        
        @Query("withinfo") withinfo: string,        
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        uploadFile(req, res, "chofer", size, {withname, withinfo});
    }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async getAll(
        @Res() res: HttpResponse,
    ) {
        res.status(HttpStatus.OK).send(await this.choferService.getAll());
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException})
    async findById(
        @Param("id") id: string,
        @Res() res?: HttpResponse
    ) {
        return this.choferService.findById(id)
        .then(resp => {
            if (resp) {
                res?.status(HttpStatus.OK).send(this.choferService.normalize([resp])[0]);
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
        @Body() body: Chofer,
        @Res() res?: HttpResponse,
    ) {
        if (Object.keys(body).length <= 1) {
            res?.status(500).send({message: 'Invalid request'});
            return null;
        }

        body.foto = convertImages(body.foto, true);
        const chofer = await this.choferService.findOne({dni: body.dni});
        if(chofer) {
            res?.status(HttpStatus.NOT_ACCEPTABLE).send({message: "Ya existe un chofer para el DNI ingresado"});
            return chofer;
        }
        
        body.id = toString(parseNumber(this.choferService.maxInArray(await this.choferService.findAll({}), "id", true)) + 1);
        return this.choferService.create(body)
        .then(resp => {
            if (resp) {
                res?.status(HttpStatus.OK).send(this.choferService.normalize([resp])[0]);
            } else {
                res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message: "No se pudo insertar el chofer"});
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
               
        const item = await this.choferService.findOne({id});
        if (!item) {
            res?.status(500).send({message: 'No se encontro el ID a actualizar'}); 
            return null;
        }
        if (body.dni != item.dni) {
            const chofer = await this.choferService.findOne({dni: body.dni, id: {$nin: [item.id]}});
            if(chofer) {
                res?.status(HttpStatus.NOT_ACCEPTABLE).send({message: "Ya existe un chofer para el DNI ingresado"});
                return null;
            }
        }
        body.foto = convertImages(body.foto, true);            
        
        return this.choferService.updateMany(body, {id})
        .then(resp => {
            if (resp) {
                res?.status(HttpStatus.OK).send(resp);
            } else {
                res?.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message: "No se pudo actualizar el chofer"});
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
        res.status(HttpStatus.OK).send(await this.choferService.deleteMany({id}))
    }

}
