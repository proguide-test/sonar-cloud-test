import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    PlanController
  ],
  providers: [
    PlanService
  ],
  exports: [
    PlanService
  ],
})
export class PlanModule { }
