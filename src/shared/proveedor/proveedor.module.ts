import { Module } from '@nestjs/common';
import { ProveedorController } from './proveedor.controller';
import { ProveedorService } from './proveedor.service';
import { HttpModule } from '@nestjs/axios';
import { TipoMService } from '../tipomaterial/tipom.service';
import { TipoMController } from '../tipomaterial/tipom.controller';
import { MaterialController } from '../materialidad/material.controller';
import { MaterialService } from '../materialidad/material.service';

@Module({
  imports: [
    HttpModule,  
  ],
  controllers: [
    ProveedorController,
    TipoMController,
    MaterialController
  ],
  providers: [
    ProveedorService,
    TipoMService,
    MaterialService
  ],
  exports: [
    ProveedorService,
    TipoMService,
    MaterialService
  ],
})
export class ProveedorModule { }
