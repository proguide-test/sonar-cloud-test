import { Module } from '@nestjs/common';
import { PaisController } from './pais.controller';
import { PaisService } from './pais.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    PaisController
  ],
  providers: [
    PaisService
  ],
  exports: [
    PaisService
  ],
})
export class PaisModule { }
