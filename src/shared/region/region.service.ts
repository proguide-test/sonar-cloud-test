import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { CentroDistribucionService } from '../centrodistribucion/centrodistribucion.service';
import { DistribuidorService } from '../distribuidor/distribuidor.service';
import { EstadoDistribucionService } from '../estadodistribucion/estadodistribucion.service';
import { ProveedorService } from '../proveedor/proveedor.service';
import { PuntoDeVentaService } from '../puntodeventa/puntodeventa.service';
import { Region } from './model/region.model';

@Injectable()
export class RegionService extends BaseFullService<Region> {
    constructor(
        protected httpService: HttpService,
        public proveedorService: ProveedorService,
        public puntoDeVentaService: PuntoDeVentaService,
        public distribuidorService: DistribuidorService,
        public centroDistribucionService: CentroDistribucionService,
        public estadoDistribucionService: EstadoDistribucionService,
        
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'region'}, httpService);
    }    
}
