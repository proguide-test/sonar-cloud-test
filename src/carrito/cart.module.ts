import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { HttpModule } from '@nestjs/axios';
import { SharedModule } from '../shared/shared.module';
import { ProductService } from '../producto/producto.service';
import { ProductModule } from '../producto/producto.module';
import { NotificationModule } from '@proguidemc/notification-module';
import { CarritomovService } from '../carritomov/carritomov.service';
import { CarritoEstadoService } from './carritoestado.service';
import { ConfigModule } from '../shared/config/config.module';
import { CarritoPostergadoService } from './carritopostergado/carritopostergado.service';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { LugarModule } from '../shared/lugar/lugar.module';
import { LegacyModule } from '../shared/legacy/legacy.module';

@Module({
  imports: [
    HttpModule,
    SharedModule,
    ProductModule,
    NotificationModule,
    ConfigModule,
    LugarModule,
    LegacyModule,
  ],
  controllers: [
    CartController,
  ],
  providers: [
    UserConfigService,
    CarritoPostergadoService,
    CarritoEstadoService,
    CartService,
    ProductService,
    CarritomovService,
  ],
  exports: [
    CarritoPostergadoService,
    CarritoEstadoService,
    ProductService,
    CartService
  ],
})
export class CartModule { }
