import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StockMovController } from './stockmov.controller';
import { StockMovService } from './stockmov.service';
import { StockMovTipoService } from './stockmovtipo.service';
import { ProductModule } from '../producto/producto.module';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { LugarModule } from '../shared/lugar/lugar.module';
import { NotificationModule } from '@proguidemc/notification-module';

@Module({
  imports: [
    HttpModule,  
    forwardRef(() => ProductModule),
    LugarModule,
    NotificationModule,
  ],
  controllers: [
    StockMovController
  ],
  providers: [    
    UserConfigService,
    StockMovService,
    StockMovTipoService,
  ],
  exports: [
    StockMovTipoService,
    StockMovService
  ],
})
export class StockMovModule { }
