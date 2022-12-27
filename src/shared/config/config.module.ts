import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from './config.service';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
  ],
  providers: [
    ConfigService,
  ],
  exports: [
    ConfigService,
  ],
})

export class ConfigModule { }
