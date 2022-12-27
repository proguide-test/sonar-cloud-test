import { Module } from '@nestjs/common';
import { VehiculoController } from './vehiculo.controller';
import { VehiculoService } from './vehiculo.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    VehiculoController
  ],
  providers: [
    VehiculoService,
  ],
  exports: [
    VehiculoService
  ],
})
export class VehiculoModule { }
