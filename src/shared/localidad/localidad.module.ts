import { Module } from '@nestjs/common';
import { LocalidadService } from './localidad.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
  ],
  providers: [
    LocalidadService,
  ],
  exports: [
    LocalidadService
  ],
})
export class LocalidadModule { }
