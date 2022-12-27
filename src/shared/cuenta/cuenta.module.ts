import { Module } from '@nestjs/common';
import { CuentaController } from './cuenta.controller';
import { CuentaService } from './cuenta.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    CuentaController
  ],
  providers: [
    CuentaService
  ],
  exports: [
    CuentaService
  ],
})
export class CuentaModule { }
