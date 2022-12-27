import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { SupervisorService } from './supervisor.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
import { basicNormalizeItems } from '../utils/utils';

@UseGuards(AuthGuard('jwt'))    
@Controller('supervisor')
export class SupervisorController {
   
    constructor(
        private supervisorService: SupervisorService,
    ) { }

    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de supervisores', operationId: 'supervisor' })
    async GetCanal(
        @Res() res: HttpResponse,
    ) {
        const items = await this.supervisorService.findAll({});
        res.send(basicNormalizeItems(items));                    
    }

    @Get(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException})
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse
    ) {
        res.send(await this.supervisorService.findOne({id}));        
    }

}