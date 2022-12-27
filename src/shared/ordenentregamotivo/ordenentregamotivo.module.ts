import { Module } from '@nestjs/common';
import { OrdenEntregaMotivoController } from './ordenentregamotivo.controller';
import { OrdenEntregaMotivoService } from './ordenentregamotivo.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    OrdenEntregaMotivoController
  ],
  providers: [
    OrdenEntregaMotivoService
  ],
  exports: [
    OrdenEntregaMotivoService
  ],
})
export class OrdenEntregaMotivoModule { }
