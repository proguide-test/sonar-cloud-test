import { Module } from '@nestjs/common';
import { MaterialController } from './material.controller';
import { MaterialService } from './material.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    MaterialController
  ],
  providers: [
    MaterialService
  ],
  exports: [
    MaterialService
  ],
})
export class MaterialModule { }
