import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { OrdenTransporteEstado } from './model/ordentransporteestado.model';

@Injectable()
export class OrdenTransporteEstadoService extends BaseFullService<OrdenTransporteEstado> {
    
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'ordentransporteestado'}, httpService);
    }
    
}