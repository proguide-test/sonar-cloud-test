import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { CanalService } from '../canal/canal.service';
import { CategoriaService } from '../categoria/categoria.service';
import { CentroService } from '../centro/centro.service';
import { TipoMService } from '../tipomaterial/tipom.service';
import { TipoPService } from '../tipoprecio/tipop.service';
import { Sociedad } from './model/sociedad.model';

@Injectable()
export class SociedadService extends BaseFullService<Sociedad> {
    constructor(protected httpService: HttpService,
        public centroService: CentroService,        
        public canalService: CanalService,
        public tipoPService: TipoPService,
        public tipoMService: TipoMService,
        public categoriaService: CategoriaService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'sociedad'}, httpService);
    }
}
