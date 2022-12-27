import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, FlexService, MainModule, HttpErrorFilter, DBName } from '@proguidemc/http-module';
import { SharedModule } from './shared/shared.module';
import { CartModule } from './carrito/cart.module';
import { HttpModule } from '@nestjs/axios';
import {AlmacenModule } from './shared/almacen/almacen.module'
import { CanalModule } from './shared/canal/canal.module';
import { CategoriaModule } from './shared/categoria/categoria.module';
import { IdiomaModule } from './shared/idioma/idioma.module';
import { MarcaModule } from './shared/marca/marca.module';
import { MaterialModule } from './shared/materialidad/material.module';
import { PaisModule } from './shared/pais/pais.module';
import { TipoMModule } from './shared/tipomaterial/tipom.module';
import { TipoPModule } from './shared/tipoprecio/tipop.module';
import { UbicacionModule } from './shared/ubicacion/ubicacion.module';
import { EstadoDistribucionModule } from './shared/estadodistribucion/estadodistribucion.module';
import { PuntoDeVentaModule } from './shared/puntodeventa/puntodeventa.module';
import { DistribuidorModule } from './shared/distribuidor/distribuidor.module';
import { TipoAModule } from './shared/tipoarchivo/tipoarchivo.module';
import { DimensionModule } from './shared/dimension/dimension.module';
import { SociedadModule } from './shared/sociedad/sociedad.module';
import { CentroModule } from './shared/centro/centro.module';
import { ProveedorModule } from './shared/proveedor/proveedor.module';
import { WidgetsModule } from './widgets/widgets.module';
import { PlanillaModule } from './planillaarmado/planilla.module';
import { OrdenTransporteModule } from './ordentransporte/ordentransporte.module';
import { ChoferModule } from './shared/chofer/chofer.module';
import { VehiculoModule } from './shared/vehiculo/vehiculo.module';
import { OperadorLogicoModule } from './shared/operadorlogico/operadorlogico.module';
import { PlanillaDespachoModule } from './planilladespacho/planilladespacho.module';
import { PalletModule } from './pallet/pallet.module';
import { StockMovModule } from './stockmov/stockmov.module';
import { PlanillaRecepcionModule } from './planillarecepcion/planillarecepcion.module';
import { NotificationModule } from '@proguidemc/notification-module';
import { LiquidacionModule } from './liquidacion/liquidacion.module';
import { UserConfigService } from './shared/userconfig/userconfig.service';
import { LugarModule } from './shared/lugar/lugar.module';

@Module({
  imports: [
    SharedModule,
    CartModule,
    AlmacenModule,
    CanalModule,
    CategoriaModule,
    IdiomaModule,
    MarcaModule,
    MaterialModule,
    PaisModule,
    TipoMModule,
    TipoPModule,
    EstadoDistribucionModule,
    UbicacionModule,
    PuntoDeVentaModule,
    DistribuidorModule,
    TipoAModule,
    DimensionModule,
    SociedadModule,
    CentroModule,
    ProveedorModule,
    WidgetsModule,
    PlanillaModule,
    OrdenTransporteModule,
    HttpModule,
    VehiculoModule,
    OperadorLogicoModule,
    ChoferModule,
    PalletModule,
    PlanillaDespachoModule,
    PlanillaRecepcionModule,
    StockMovModule,
    NotificationModule,
    LiquidacionModule,
    LugarModule,
    ConfigModule.setDatabase(DBName.ShoppingManager)
  ],
  controllers: [AppController],
  providers: [
    UserConfigService,
    String,
    FlexService,
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter,
    }],
})

export class AppModule extends MainModule {}
