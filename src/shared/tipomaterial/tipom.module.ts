import { Module } from '@nestjs/common';
import { TipoMController } from './tipom.controller';
import { TipoMService } from './tipom.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    TipoMController
  ],
  providers: [
    TipoMService,
  ],
  exports: [
    TipoMService
  ],
})
export class TipoMModule { }
