import { Module } from '@nestjs/common';
import { DepositoController } from './deposito.controller';
import { DepositoService } from './deposito.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    DepositoController
  ],
  providers: [
    DepositoService
  ],
  exports: [
    DepositoService
  ],
})
export class DepositoModule { }
