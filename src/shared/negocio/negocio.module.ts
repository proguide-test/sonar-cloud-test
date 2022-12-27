import { Module } from '@nestjs/common';
import { NegocioController } from './negocio.controller';
import { NegocioService } from './negocio.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    NegocioController
  ],
  providers: [
    NegocioService
  ],
  exports: [
    NegocioService
  ],
})
export class NegocioModule { }
