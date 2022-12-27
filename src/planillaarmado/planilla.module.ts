import { forwardRef, Module } from '@nestjs/common';
import { PlanillaService } from './planilla.service';
import { HttpModule } from '@nestjs/axios';
import { PlanillaEstadoService } from './planillaestado.service';
import { ProductModule } from '../producto/producto.module';
import { PlanillaController } from './planilla.controller';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { OrdenTransporteModule } from '../ordentransporte/ordentransporte.module';
import { PlanModule } from '../shared/plan/plan.module';
import { TableBufferService } from './tablebuffer.service';
import { LugarModule } from '../shared/lugar/lugar.module';
import { LegacyModule } from '../shared/legacy/legacy.module';
import { NotificationModule } from '@proguidemc/notification-module';

@Module({
  imports: [
    forwardRef(() => OrdenTransporteModule),
    ProductModule,
    PlanModule,
    HttpModule,
    LugarModule,
    LegacyModule,
    NotificationModule,
  ],
  controllers: [
    PlanillaController
  ],
  providers: [
    UserConfigService,
    PlanillaService,
    TableBufferService,
    PlanillaEstadoService,
  ],
  exports: [
    TableBufferService,
    PlanillaService,
    PlanillaEstadoService,
  ],
})
export class PlanillaModule { }
