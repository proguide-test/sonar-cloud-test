import { Module } from '@nestjs/common';
import { IdiomaController } from './idioma.controller';
import { IdiomaService } from './idioma.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    IdiomaController
  ],
  providers: [
    IdiomaService
  ],
  exports: [
    IdiomaService
  ],
})
export class IdiomaModule { }
