import { Controller, Get, UseGuards, HttpStatus, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { CampaniaService } from './campania.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';

@UseGuards(AuthGuard('jwt'))    
@Controller('campania')
export class CampaniaController {

    constructor(private campaniaService: CampaniaService) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de campañas', operationId: 'campaña' })
    async GetCampania(
        @Res() res: HttpResponse,
    ) {
        const items = await this.campaniaService.findAll({});
        res.send(items);        
    }

}
