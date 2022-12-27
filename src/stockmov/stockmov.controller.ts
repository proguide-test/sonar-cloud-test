import { Controller, Get, UseGuards, Res, Query, Post, Body, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { StockMovService } from './stockmov.service';
import { EndPointResponse, HttpRequest, HttpResponse, JwtPayload, User } from '@proguidemc/http-module';
import { StockMovRegister } from './model/stockmov.model';

@ApiTags("Stock")
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))    
@Controller('stock-mov')
export class StockMovController {
    constructor(private stockMovService: StockMovService) { }

    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest, 
    ) {
        this.find(res, req.user, "2021-10-01", "2022-06-10", "");
    }
    
    @Get()
    @EndPointResponse({ summary: 'Obtener movimientos de stock por rango de fechas', operationId: 'stock-get-all' })
    @ApiQuery({required: false, name: 'id', description: 'Id de material'})
    @ApiQuery({required: true, name: 'from', description: 'Fecha desde'})
    @ApiQuery({required: true, name: 'to', description: 'Fecha hasta'})
    async find(
        @Res() res: HttpResponse,
        @User() user: JwtPayload,
        @Query("from") from: string,
        @Query("to") to: string,
        @Query("id") id: string,
    ) {
        this.stockMovService.get(user, from, to, id)
        .then(resp => {
            res.status(200).send(resp);            
        })
        .catch(error => {
            res.status(500).send(error);            
        })
    }

    @Post()
    @EndPointResponse({ summary: 'Registrar movimiento de stock', operationId: 'stock-register' })
    async save(
        @Res() res: HttpResponse,
        @User() user: JwtPayload,
        @Body() body: StockMovRegister
    ) {        
        this.stockMovService.register({
            ...body,
            usuario: user.username
        })
        .then(resp => {
            res.status(200).send(resp);            
        })
        .catch(error => {
            res.status(500).send(error);            
        })
    }

}
