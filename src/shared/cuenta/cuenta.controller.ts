import { Controller, Get, UseGuards, HttpStatus, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { CuentaService } from './cuenta.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';

@UseGuards(AuthGuard('jwt'))    
@Controller('cuenta')
export class CuentaController {
   
    constructor(
        private cuentaService: CuentaService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de cuentas', operationId: 'cuenta' })
    async GetCuenta(
        @Res() res: HttpResponse,
    ) {
        const items = await this.cuentaService.findAll({});
        res.send(items);
    }

}
