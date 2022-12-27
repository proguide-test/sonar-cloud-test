import { Module } from '@nestjs/common';
import { CanalController } from './canal.controller';
import { CanalService } from './canal.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    CanalController
  ],
  providers: [
    CanalService
  ],
  exports: [
    CanalService
  ],
})
export class CanalModule { }
