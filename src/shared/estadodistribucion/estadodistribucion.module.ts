import { Module } from '@nestjs/common';
import { EstadoDistribucionController } from './estadodistribucion.controller';
import { EstadoDistribucionService } from './estadodistribucion.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    EstadoDistribucionController
  ],
  providers: [
    EstadoDistribucionService
  ],
  exports: [
    EstadoDistribucionService
  ],
})
export class EstadoDistribucionModule { }
