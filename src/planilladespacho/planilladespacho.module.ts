import { forwardRef, Module } from '@nestjs/common';
import { PlanillaDespachoService } from './planilladespacho.service';
import { HttpModule } from '@nestjs/axios';
import { ProductModule } from '../producto/producto.module';
import { PlanillaDespachoController } from './planilladespacho.controller';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { OrdenTransporteModule } from '../ordentransporte/ordentransporte.module';
import { PalletModule } from '../pallet/pallet.module';
import { PlanillaDespachoEstadoService } from './planilladespachoestado.service';
import { ChoferModule } from '../shared/chofer/chofer.module';
import { OperadorLogicoModule } from '../shared/operadorlogico/operadorlogico.module';
import { VehiculoModule } from '../shared/vehiculo/vehiculo.module';
import { PlanillaRecepcionModule } from '../planillarecepcion/planillarecepcion.module';
import { LugarModule } from '../shared/lugar/lugar.module';
import { NotificationModule } from '@proguidemc/notification-module';

@Module({
  imports: [
    ProductModule,
    ChoferModule,
    OperadorLogicoModule,
    VehiculoModule,
    OrdenTransporteModule,
    PalletModule,    
    forwardRef(() => PlanillaRecepcionModule),
    HttpModule,    
    LugarModule,
    NotificationModule,
  ],
  controllers: [
    PlanillaDespachoController
  ],
  providers: [
    UserConfigService,
    PlanillaDespachoService,
    PlanillaDespachoEstadoService
  ],
  exports: [
    PlanillaDespachoService,
    PlanillaDespachoEstadoService
  ],
})
export class PlanillaDespachoModule { }
