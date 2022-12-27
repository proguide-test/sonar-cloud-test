import { Module } from '@nestjs/common';
import { LugarService } from './lugar.service';
import { HttpModule } from '@nestjs/axios';
import { LugarTipoService } from './lugartipo.service';
import { LugarController } from './lugar.controller';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    LugarController
  ],
  providers: [
    LugarService,
    LugarTipoService,
  ],
  exports: [
    LugarTipoService,
    LugarService
  ],
})
export class LugarModule { }
