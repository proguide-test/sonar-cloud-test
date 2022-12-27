import { Module } from '@nestjs/common';
import { PuntoDeVentaController } from './puntodeventa.controller';
import { PuntoDeVentaService } from './puntodeventa.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    PuntoDeVentaController
  ],
  providers: [
    PuntoDeVentaService
  ],
  exports: [
    PuntoDeVentaService
  ],
})
export class PuntoDeVentaModule { }
