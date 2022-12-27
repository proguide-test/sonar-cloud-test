import { Module } from '@nestjs/common';
import { VendedorController } from './vendedor.controller';
import { VendedorService } from './vendedor.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    VendedorController
  ],
  providers: [
    VendedorService,
  ],
  exports: [
    VendedorService
  ],
})
export class VendedorModule { }
