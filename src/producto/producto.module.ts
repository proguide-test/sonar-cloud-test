import { Module } from '@nestjs/common';
import { ProductController } from './producto.controller';
import { ProductService } from './producto.service';
import { HttpModule } from '@nestjs/axios';
import { SharedModule } from '../shared/shared.module';
import { NotificationModule } from '@proguidemc/notification-module';
import { LegacyModule } from '../shared/legacy/legacy.module';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { LugarModule } from '../shared/lugar/lugar.module';

@Module({
  imports: [
    HttpModule,
    SharedModule,   
    NotificationModule,    
    LegacyModule,
    LugarModule,
  ],
  controllers: [
    ProductController
  ],
  providers: [    
    ProductService,
    UserConfigService,
  ],
  exports: [
    ProductService,    
  ],
})
export class ProductModule { }
