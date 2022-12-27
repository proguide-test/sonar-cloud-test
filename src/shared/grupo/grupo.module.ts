import { Module } from '@nestjs/common';
import { GrupoController } from './grupo.controller';
import { GrupoService } from './grupo.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    GrupoController
  ],
  providers: [
    GrupoService
  ],
  exports: [
    GrupoService
  ],
})
export class GrupoModule { }
