import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '@proguidemc/http-module';
import * as path from "path";
import { ConfigService } from './config/config.service';
import { PrinterService } from './printer/printer.service';
import { MarcaModule } from './marca/marca.module';
import { CanalModule } from './canal/canal.module';
import { CategoriaModule } from './categoria/categoria.module';
import { TipoMModule } from './tipomaterial/tipom.module';
import { TipoPModule } from './tipoprecio/tipop.module';
import { IdiomaModule } from './idioma/idioma.module';
import { PaisModule } from './pais/pais.module';
import { UbicacionModule } from './ubicacion/ubicacion.module';
import { MaterialModule } from './materialidad/material.module';
import { AlmacenModule } from './almacen/almacen.module';
import { CampaniaModule } from './campania/campania.module';
import { PlanModule  } from './plan/plan.module';
import { CentrocostoModule } from './centrocosto/centrocosto.module';
import { CuentaModule } from './cuenta/cuenta.module';
import { EstrategiaModule } from './estrategia/estrategia.module';
import { RegionModule } from './region/region.module';
import { EstadoDistribucionModule } from './estadodistribucion/estadodistribucion.module';
import { CentroDistribucionModule } from './centrodistribucion/centrodistribucion.module';
import { DistribuidorModule } from './distribuidor/distribuidor.module';
import { PuntoDeVentaModule } from './puntodeventa/puntodeventa.module';
import { SupervisorModule } from './supervisor/supervisor.module';
import { VendedorModule } from './vendedor/vendedor.module';
import { SociedadModule } from './sociedad/sociedad.module';
import { OrdenEntregaMotivoModule } from './ordenentregamotivo/ordenentregamotivo.module';
import { DepositoModule } from './deposito/deposito.module';
import { MarcaService } from './marca/marca.service';
import { TipoMService } from './tipomaterial/tipom.service';
import { TipoPService } from './tipoprecio/tipop.service';
import { CanalService } from './canal/canal.service';
import { CentroService } from './centro/centro.service';
import { SociedadService } from './sociedad/sociedad.service';
import { AlmacenService } from './almacen/almacen.service';
import { MaterialService } from './materialidad/material.service';
import { UbicacionService } from './ubicacion/ubicacion.service';
import { PaisService } from './pais/pais.service';
import { IdiomaService } from './idioma/idioma.service';
import { CategoriaService } from './categoria/categoria.service';
import { PlanService } from './plan/plan.service';
import { RegionService } from './region/region.service';
import { ProveedorService } from './proveedor/proveedor.service';
import { PuntoDeVentaService } from './puntodeventa/puntodeventa.service';
import { CentroDistribucionService } from './centrodistribucion/centrodistribucion.service';
import { DistribuidorService } from './distribuidor/distribuidor.service';
import { EstadoDistribucionService } from './estadodistribucion/estadodistribucion.service';
import { EstrategiaService } from './estrategia/estrategia.service';
import { GrupoModule } from './grupo/grupo.module';
import { GrupoService } from './grupo/grupo.service';
import { NegocioModule } from './negocio/negocio.module';
import { NegocioService } from './negocio/negocio.service';

@Global()
@Module({
    imports: [
        AuthModule.setKey(path.join(__dirname, "../../resources/keys/um-public.key")),
        HttpModule,
        MarcaModule,
        GrupoModule,
        CanalModule,
        CategoriaModule,
        TipoMModule,
        TipoPModule,
        IdiomaModule,
        PaisModule,
        UbicacionModule,
        MaterialModule,
        AlmacenModule,
        CampaniaModule,
        PlanModule,
        CentrocostoModule,
        CuentaModule,
        EstrategiaModule,
        RegionModule,
        EstadoDistribucionModule,
        CentroDistribucionModule,
        DistribuidorModule,
        PuntoDeVentaModule,
        SupervisorModule,
        VendedorModule,
        SociedadModule,
        OrdenEntregaMotivoModule,
        DepositoModule,        
        NegocioModule,        
    ],
    providers: [
        GrupoService,
        MarcaService,
        IdiomaService,
        PaisService,
        UbicacionService,
        MaterialService,
        AlmacenService,
        SociedadService,        
        CentroService,        
        CanalService,
        TipoPService,
        TipoMService,
        CategoriaService,
        PlanService,
        RegionService,
        ProveedorService,
        PuntoDeVentaService,
        CentroDistribucionService,
        DistribuidorService,
        EstadoDistribucionService,
        EstrategiaService,
        ConfigService,
        PrinterService,
        NegocioService,
    ],
    exports: [
        GrupoService,
        EstrategiaService,
        EstadoDistribucionService,
        DistribuidorService,
        CentroDistribucionService,
        PuntoDeVentaService,
        RegionService,
        ProveedorService,
        CategoriaService,
        IdiomaService,
        PaisService,
        UbicacionService,
        MaterialService,
        AlmacenService,
        SociedadService,        
        CentroService,        
        CanalService,
        TipoPService,
        TipoMService,
        MarcaService,
        ConfigService,
        PrinterService,
        PlanService,
        NegocioService,
    ],
})

export class SharedModule {}