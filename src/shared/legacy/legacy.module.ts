import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LegacyController } from './legacy.controller';
import { StockConsultaService } from './services/stockconsulta.service';
import { StockReservaService } from './services/stockreserva.service';
import { StockInterplantaService } from './services/stockinterplanta.service';
import { UepUnassignedService } from './services/uep-unassigned.service';
import { PedidoComercialService } from './services/pedido-comercial.service';
import { MaterialesService } from './services/materiales.service';
import { OrdenConsultaService } from './services/orden.consulta.service';
import { StockMovModule } from '../../stockmov/stockmov.module';
import { MovimientoService } from './services/movimiento.service';
import { TestService } from './services/test.service';
import { StockService } from './services/stock.service';

@Module({
  imports: [
    HttpModule,    
    StockMovModule,
  ],
  controllers: [
    LegacyController
  ],
  providers: [
    StockService,
    StockConsultaService,
    StockReservaService,
    StockInterplantaService,
    UepUnassignedService,
    PedidoComercialService,  
    MaterialesService,  
    OrdenConsultaService,
    MovimientoService,
    TestService,
  ],
  exports: [
    OrdenConsultaService,
    StockConsultaService,
    StockReservaService,
    StockInterplantaService,
    UepUnassignedService,
    PedidoComercialService,
    MaterialesService,
    MovimientoService,
    TestService,
  ]
})
export class LegacyModule { }
