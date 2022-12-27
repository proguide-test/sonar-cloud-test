import { Module } from '@nestjs/common';
import { MarcaController } from './marca.controller';
import { MarcaService } from './marca.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    MarcaController
  ],
  providers: [
    MarcaService
  ],
  exports: [
    MarcaService
  ],
})
export class MarcaModule { }
