import { forwardRef, Module } from '@nestjs/common';
import { OrdenTransporteService } from './ordentransporte.service';
import { HttpModule } from '@nestjs/axios';
import { OrdenTransporteEstadoService } from './ordentransporteestado.service';
import { ProductModule } from '../producto/producto.module';
import { ProveedorModule } from '../shared/proveedor/proveedor.module';
import { OrdenTransporteController } from './ordentransporte.controller';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { CartModule } from '../carrito/cart.module';
import { PlanModule } from '../shared/plan/plan.module';
import { LugarModule } from '../shared/lugar/lugar.module';
import { PalletModule } from '../pallet/pallet.module';
import { ConfigModule } from '../shared/config/config.module';
import { NotificationConfigModule } from '../shared/notification-config/notification-config.module';
import { NotificationModule } from '@proguidemc/notification-module';
import { PrioridadService } from './prioridad.service';

@Module({
  imports: [
    ProductModule,
    ProveedorModule,
    CartModule,
    PlanModule,
    HttpModule,    
    LugarModule,
    ConfigModule,
    forwardRef(() => PalletModule),
    NotificationConfigModule,
    NotificationModule,
  ],
  controllers: [
    OrdenTransporteController
  ],
  providers: [
    PrioridadService,
    UserConfigService,
    OrdenTransporteService,
    OrdenTransporteEstadoService, 
  ],
  exports: [
    PrioridadService,
    OrdenTransporteService,
    OrdenTransporteEstadoService,
  ],
})
export class OrdenTransporteModule { }
