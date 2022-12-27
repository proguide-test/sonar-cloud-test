import { Module } from '@nestjs/common';
import { SubcadenaService } from './subcadena.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
  ],
  providers: [
    SubcadenaService,
  ],
  exports: [
    SubcadenaService
  ],
})
export class SubcadenaModule { }
