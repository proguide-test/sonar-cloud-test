import { Module } from '@nestjs/common';
import { TipoPController } from './tipop.controller';
import { TipoPService } from './tipop.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    TipoPController
  ],
  providers: [
    TipoPService,
  ],
  exports: [
    TipoPService
  ],
})
export class TipoPModule { }
