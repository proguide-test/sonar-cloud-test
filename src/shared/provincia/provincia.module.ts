import { Module } from '@nestjs/common';
import { ProvinciaService } from './provincia.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
  ],
  providers: [
    ProvinciaService,
  ],
  exports: [
    ProvinciaService
  ],
})
export class ProvinciaModule { }
