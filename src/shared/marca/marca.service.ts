import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { AlmacenService } from '../almacen/almacen.service';
import { IdiomaService } from '../idioma/idioma.service';
import { MaterialService } from '../materialidad/material.service';
import { PaisService } from '../pais/pais.service';
import { UbicacionService } from '../ubicacion/ubicacion.service';
import { Marca } from './model/marca.model';

@Injectable()
export class MarcaService extends BaseFullService<Marca> {
    constructor(
        protected httpService: HttpService,
        public idiomaService: IdiomaService,
        public paisService: PaisService,
        public ubicacionService: UbicacionService,
        public materialService: MaterialService,
        public almacenService: AlmacenService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'marca'}, httpService);
    }
}
