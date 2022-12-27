import { Module } from '@nestjs/common';
import { SociedadController } from './sociedad.controller';
import { SociedadService } from './sociedad.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    SociedadController
  ],
  providers: [
    SociedadService,
  ],
  exports: [
    SociedadService,
  ],
})
export class SociedadModule { }
