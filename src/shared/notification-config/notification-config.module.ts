import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationConfigService } from './notification-config.service';
import { UserConfigService } from '../userconfig/userconfig.service';
import { NotificationModule } from '@proguidemc/notification-module';
import { LugarModule } from '../lugar/lugar.module';

@Module({
  imports: [
    HttpModule,  
    NotificationModule,    
    LugarModule,
  ],
  providers: [        
    UserConfigService,
    NotificationConfigService,
  ],
  exports: [
    NotificationConfigService,
  ],
})
export class NotificationConfigModule { }
