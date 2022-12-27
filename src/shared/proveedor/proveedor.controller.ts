import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { ProveedorService } from './proveedor.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { TipoMService } from '../tipomaterial/tipom.service';
import { MaterialService } from '../materialidad/material.service';
import { toString } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('proveedor')
export class ProveedorController {
    
    constructor(
        private proveedorService: ProveedorService,
        private tipoMService: TipoMService,
        private materialService: MaterialService,
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de proveedores', operationId: 'proveedor' })
    async findAll(
        @Res() response: HttpResponse,
    ) {
        const tiposMaterial = await this.tipoMService.findAll({});
        const materialidades = await this.materialService.findAll({});
            
        const items = await this.proveedorService.findAll({});
        items.forEach(res => {
            res.enabled = res.enabled || false;
            res.tipomaterialid = toString(tiposMaterial.find(item => item.id == res.tipomaterialid)?.name);
            if (Array.isArray(res.materialidadid) && res.materialidadid.length > 0){
                const array = materialidades.filter(item => res.materialidadid.indexOf(toString(item.id)) >= 0);
                res.materialidadid = array.map(m => m.name).join(' - ');
            }else {
                res.materialidadid = []
            }
        });
        response.send(items);
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        const item = await this.proveedorService.findById(id);
        if (item && Array.isArray(item.materialidadid)) {
            item.materialidadid = item.materialidadid.join(',');
        }
        return res.send(item);    
    }

}
