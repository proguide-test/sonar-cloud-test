import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { PalletController } from './pallet.controller';
import { PalletService } from './pallet.service';
import { ProductModule } from '../producto/producto.module';
import { OrdenTransporteModule } from '../ordentransporte/ordentransporte.module';
import { PalletEstadoService } from './palletestado.service';
import { LugarModule } from '../shared/lugar/lugar.module';
import { PlanillaModule } from '../planillaarmado/planilla.module';
import { NotificationModule } from '@proguidemc/notification-module';

@Module({
  imports: [
    HttpModule,
    ProductModule,
    forwardRef(() => OrdenTransporteModule),
    forwardRef(() => PlanillaModule),
    LugarModule,
    NotificationModule,
  ],
  controllers: [
    PalletController
  ],
  providers: [
    UserConfigService,
    PalletService,
    PalletEstadoService
  ],
  exports: [
    PalletService,
    PalletEstadoService
  ],
})
export class PalletModule { }
