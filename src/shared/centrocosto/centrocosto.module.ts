import { Module } from '@nestjs/common';
import { CentrocostoController } from './centrocosto.controller';
import { CentrocostoService } from './centrocosto.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    CentrocostoController
  ],
  providers: [
    CentrocostoService
  ],
  exports: [
    CentrocostoService
  ],
})
export class CentrocostoModule { }
