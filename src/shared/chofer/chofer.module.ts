import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserConfigService } from '../userconfig/userconfig.service';
import { ChoferController } from './chofer.controller';
import { ChoferService } from './chofer.service';
import { LugarModule } from '../lugar/lugar.module';
import { NotificationModule } from '@proguidemc/notification-module';


@Module({
  imports: [
    HttpModule,    
    LugarModule,
    NotificationModule,
  ],
  controllers: [
    ChoferController
  ],
  providers: [
    UserConfigService,
    ChoferService
  ],
  exports: [
    ChoferService
  ]
})
export class ChoferModule { }
