import { Controller, Get, UseGuards, HttpStatus, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { CentrocostoService } from './centrocosto.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';

@UseGuards(AuthGuard('jwt'))    
@Controller('centrocosto')
export class CentrocostoController {
    
    constructor(
        private centrocostoService: CentrocostoService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de centro de costos', operationId: 'centrocosto' })
    async GetCentrocosto(
        @Res() res: HttpResponse,
    ) {
        const items = await this.centrocostoService.findAll({});
        res.send(items);
    }

}
