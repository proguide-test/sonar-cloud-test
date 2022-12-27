import { Module } from '@nestjs/common';
import { TipoAController } from './tipoarchivo.controller';
import { TipoAService } from './tipoarchivo.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    TipoAController
  ],
  providers: [
    TipoAService,
  ],
  exports: [
    TipoAService
  ],
})
export class TipoAModule { }
