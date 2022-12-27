 import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '@nestjs/swagger';
import { LugarService } from './lugar.service';
import { ApiException, HttpResponse } from '@proguidemc/http-module';
    
@Controller('lugar')
export class LugarController {
    constructor(private lugarService: LugarService) { }
   
    @UseGuards(AuthGuard('jwt'))
    @Get('estados')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findEstados(@Res() res: HttpResponse) {
        res.send(await this.lugarService.lugarTipoService.findAll({}));
    }
    
    @UseGuards(AuthGuard('jwt'))    
    @Get(':id')
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    async findById(
        @Param("id") id: string,
        @Res() res: HttpResponse,
    ) {
        res.send(await this.lugarService.findById(id));
    }

}
