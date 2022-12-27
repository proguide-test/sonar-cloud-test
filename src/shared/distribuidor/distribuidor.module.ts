import { Module } from '@nestjs/common';
import { DistribuidorController } from './distribuidor.controller';
import { DistribuidorService } from './distribuidor.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    DistribuidorController
  ],
  providers: [
    DistribuidorService
  ],
  exports: [
    DistribuidorService
  ],
})
export class DistribuidorModule { }
