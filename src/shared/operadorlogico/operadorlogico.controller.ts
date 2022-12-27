import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { OperadorLogicoService } from './operadorlogico.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';

@UseGuards(AuthGuard('jwt'))    
@Controller('operadorlogico')
export class OperadorLogicoController {
    constructor(
        private operadorLogicoService: OperadorLogicoService
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de operadorLogicoes', operationId: 'operadorLogico' })
    async GetOperadorLogico(
        @Res() res: HttpResponse,
    ) {
        const operadorLogico = await this.operadorLogicoService.findAll({});
        res.send(operadorLogico);        
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de operadorLogicoes', operationId: 'operadorLogico' })
    async GetOperadorLogicoById(
        @Res() res: HttpResponse,
        @Param('id') id:string
    ) {
        const operadorLogico = await this.operadorLogicoService.findById(id);
        res.send(operadorLogico);       
    }

}
