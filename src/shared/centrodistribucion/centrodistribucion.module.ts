import { Module } from '@nestjs/common';
import { CentroDistribucionController } from './centrodistribucion.controller';
import { CentroDistribucionService } from './centrodistribucion.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    CentroDistribucionController
  ],
  providers: [
    CentroDistribucionService
  ],
  exports: [
    CentroDistribucionService
  ],
})
export class CentroDistribucionModule { }
