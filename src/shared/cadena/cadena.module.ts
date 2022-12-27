import { Module } from '@nestjs/common';
import { CadenaService } from './cadena.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
  ],
  providers: [
    CadenaService,
  ],
  exports: [
    CadenaService
  ],
})
export class CadenaModule { }
