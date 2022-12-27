import { Module } from '@nestjs/common';
import { CampaniaController } from './campania.controller';
import { CampaniaService } from './campania.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    CampaniaController
  ],
  providers: [
    CampaniaService
  ],
  exports: [
    CampaniaService
  ],
})
export class CampaniaModule { }
