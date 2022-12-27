import { Module } from '@nestjs/common';
import { DimensionController } from './dimension.controller';
import { DimensionService } from './dimension.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    DimensionController
  ],
  providers: [
    DimensionService
  ],
  exports: [
    DimensionService
  ],
})
export class DimensionModule { }
