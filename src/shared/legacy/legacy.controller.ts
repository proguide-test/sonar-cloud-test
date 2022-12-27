import { Controller, Res, Post, Body, Param, Get, UseGuards, Query, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExternalBodyTest, LegacyBaseService, LegacyType } from './services/legacybase.service';
import { MaterialesService } from './services/materiales.service';
import { OrdenConsultaService } from './services/orden.consulta.service';
import { PedidoComercialService } from './services/pedido-comercial.service';
import { MovimientoService } from './services/movimiento.service';
import { UepUnassignedService } from './services/uep-unassigned.service';
import { HttpRequest, HttpResponse } from '@proguidemc/http-module';
import { TestService } from './services/test.service';
import { StockService } from './services/stock.service';

@Controller('legacy')
export class LegacyController {
    
    private getServiceForType(type: LegacyType): LegacyBaseService<any, any> {
        switch (type) {
            case LegacyType.StockConsulta: return this.stockService.stockConsultaService;
            case LegacyType.StockReserva: return this.stockService.stockReservaService;
            case LegacyType.StockInterplanta: return this.stockService.stockInterplantaService;
            case LegacyType.PedidoComercial: return this.pedidoComercialService;
            case LegacyType.Materiales: return this.materialesService;
            case LegacyType.OrdenConsulta: return this.ordenConsultaService;
            case LegacyType.Movimiento: return this.movimientoService;
            default: return this.uepUnassignedService;
        }
    }

    constructor(
        private stockService: StockService,
        private ordenConsultaService: OrdenConsultaService,
        private uepUnassignedService: UepUnassignedService,
        private pedidoComercialService: PedidoComercialService,
        private materialesService: MaterialesService,
        private movimientoService: MovimientoService,
        private testService: TestService,
    ) { }
    
    @UseGuards(AuthGuard('jwt'))    
    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,  
        @Req() req: HttpRequest,      
    ) {        
        this.testService.run(req.user)
        .then(resp => {
            res.send(resp);
        })
        .catch(error => {
            res.send(error);
        })
    }   

    @Get('wsdl/:type')
    async getTest(
        @Query("url") url: string, 
        @Param("type") type: LegacyType,
        @Res() res: HttpResponse,        
    ) {
        const promise = url ? 
            this.stockService.stockConsultaService.unregisteredRequest(url) : 
            this.getServiceForType(type).wsdl();

        promise
        .then(resp => {
            res.setHeader("Content-Type", "text/xml");   
            res.status(200).send(resp);
        })
        .catch(error => {
            res.status(500).send(error);        
        });
    }   

    @Post('proxy/:type')
    async proxy(
        @Param("type") type: LegacyType, 
        @Query("unregistered") unregistered: boolean, 
        @Body() body: ExternalBodyTest,
        @Res() res: HttpResponse
    ) {
        const promise = unregistered ? 
            this.stockService.stockConsultaService.unregisteredRequest(body?.url, 'post', body?.request) : 
            this.getServiceForType(type).proxy(body);

        promise
        .then(resp => {
            res.status(200).send(resp);        
        })
        .catch(error => {
            res.status(500).send(error);        
        });
    }   

    @UseGuards(AuthGuard('jwt'))    
    @Post('test/:type')
    async test(
        @Param("type") type: LegacyType,
        @Body() body: any,
        @Res() res: HttpResponse,  
        @Req() req: HttpRequest,      
    ) {
        this.getServiceForType(type).post(req?.user, body)
        .then(resp => {
            res.status(200).send(resp);        
        })
        .catch(error => {
            res.status(500).send(error);        
        });
    }   
}

