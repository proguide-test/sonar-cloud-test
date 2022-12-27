import { Module } from '@nestjs/common';
import { UbicacionController } from './ubicacion.controller';
import { UbicacionService } from './ubicacion.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    UbicacionController
  ],
  providers: [
    UbicacionService,
  ],
  exports: [
    UbicacionService
  ],
})
export class UbicacionModule { }
