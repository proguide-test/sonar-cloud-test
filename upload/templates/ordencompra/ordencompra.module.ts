import { Module } from '@nestjs/common';
import { OrdenCompraService } from './ordencompra.service';
import { HttpModule } from '@nestjs/axios';
import { OrdenCompraEstadoService } from './ordencompraestado.service';
import { ProductModule } from '../producto/producto.module';
import { ProveedorModule } from '../shared/proveedor/proveedor.module';
import { OrdenEntregaModule } from '../ordenentrega/ordenentrega.module';
import { OrdenCompraController } from './ordencompra.controller';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { LugarModule } from '../shared/lugar/lugar.module';

@Module({
  imports: [
    ProductModule,
    ProveedorModule,
    OrdenEntregaModule,
    HttpModule,    
    LugarModule,
  ],
  controllers: [
    OrdenCompraController
  ],
  providers: [
    UserConfigService,
    OrdenCompraService,
    OrdenCompraEstadoService,    
  ],
  exports: [
    OrdenCompraService,
    OrdenCompraEstadoService
  ],
})
export class OrdenCompraModule { }
