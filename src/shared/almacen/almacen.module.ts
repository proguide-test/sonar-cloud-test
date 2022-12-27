import { Module } from '@nestjs/common';
import { AlmacenController } from './almacen.controller';
import { AlmacenService } from './almacen.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    AlmacenController
  ],
  providers: [
    AlmacenService,
  ],
  exports: [
    AlmacenService
  ],
})
export class AlmacenModule { }
