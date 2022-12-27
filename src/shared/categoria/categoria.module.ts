import { Module } from '@nestjs/common';
import { CategoriaController } from './categoria.controller';
import { CategoriaService } from './categoria.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    CategoriaController
  ],
  providers: [
    CategoriaService
  ],
  exports: [
    CategoriaService
  ],
})
export class CategoriaModule { }
