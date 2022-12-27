import { Module } from '@nestjs/common';
import { OperadorLogicoController } from './operadorlogico.controller';
import { OperadorLogicoService } from './operadorlogico.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    OperadorLogicoController
  ],
  providers: [
    OperadorLogicoService
  ],
  exports: [
    OperadorLogicoService
  ],
})
export class OperadorLogicoModule { }
