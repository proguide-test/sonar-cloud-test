import { Module } from '@nestjs/common';
import { SucursalService } from './sucursal.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
  ],
  providers: [
    SucursalService,
  ],
  exports: [
    SucursalService
  ],
})
export class SucursalModule { }
