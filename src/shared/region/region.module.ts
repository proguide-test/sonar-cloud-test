import { Module } from '@nestjs/common';
import { RegionController } from './region.controller';
import { RegionService } from './region.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    RegionController
  ],
  providers: [
    RegionService,
  ],
  exports: [
    RegionService
  ],
})
export class RegionModule { }
