import { Module } from '@nestjs/common';
import { LiquidacionController } from './liquidacion.controller';
import { LiquidacionService } from './liquidacion.service';
import { HttpModule } from '@nestjs/axios';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { LugarService } from '../shared/lugar/lugar.service';
import { LugarTipoService } from '../shared/lugar/lugartipo.service';
import { PlanillaRecepcionModule } from '../planillarecepcion/planillarecepcion.module';
import { NotificationModule } from '@proguidemc/notification-module';

@Module({
  imports: [
    HttpModule,
    PlanillaRecepcionModule,
    NotificationModule,
  ],
  controllers: [
    LiquidacionController
  ],
  providers: [
    LiquidacionService,
    UserConfigService,
    LugarService,
    LugarTipoService,
  ],
  exports: [
    LiquidacionService
  ],
})
export class LiquidacionModule { }
