import { Module } from '@nestjs/common';
import { CentroController } from './centro.controller';
import { CentroService } from './centro.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    CentroController
  ],
  providers: [
    CentroService,
  ],
  exports: [
    CentroService,
  ],
})
export class CentroModule { }
