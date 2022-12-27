import { Module } from '@nestjs/common';
import { EstrategiaController } from './estrategia.controller';
import { EstrategiaService } from './estrategia.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    EstrategiaController
  ],
  providers: [
    EstrategiaService
  ],
  exports: [
    EstrategiaService
  ],
})
export class EstrategiaModule { }
