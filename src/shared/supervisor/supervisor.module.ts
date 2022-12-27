import { Module } from '@nestjs/common';
import { SupervisorController } from './supervisor.controller';
import { SupervisorService } from './supervisor.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    SupervisorController
  ],
  providers: [
    SupervisorService,
  ],
  exports: [
    SupervisorService
  ],
})
export class SupervisorModule { }
