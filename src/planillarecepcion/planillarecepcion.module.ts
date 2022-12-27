import { forwardRef, Module } from '@nestjs/common';
import { PlanillaRecepcionService } from './planillarecepcion.service';
import { HttpModule } from '@nestjs/axios';
import { PlanillaRecepcionController } from './planillarecepcion.controller';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { PlanillaRecepcionEstadoService } from './planillarecepcionestado.service';
import { PlanillaDespachoModule } from '../planilladespacho/planilladespacho.module';
import { LugarModule } from '../shared/lugar/lugar.module';
import { NotificationConfigModule } from '../shared/notification-config/notification-config.module';
import { LegacyModule } from '../shared/legacy/legacy.module';
import { NotificationModule } from '@proguidemc/notification-module';

@Module({
  imports: [
    HttpModule,    
    forwardRef(() => PlanillaDespachoModule),
    LugarModule,
    NotificationConfigModule,
    LegacyModule,
    NotificationModule,
  ],
  controllers: [
    PlanillaRecepcionController
  ],
  providers: [
    UserConfigService,
    PlanillaRecepcionService,
    PlanillaRecepcionEstadoService
  ],
  exports: [
    PlanillaRecepcionService,
    PlanillaRecepcionEstadoService
  ],
})
export class PlanillaRecepcionModule { }
