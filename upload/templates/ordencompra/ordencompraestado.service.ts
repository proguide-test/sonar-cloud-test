import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { OrdenCompraEstado } from './model/ordencompraestado.model';
import { DBName, BaseService } from '@proguidemc/http-module';

@Injectable()
export class OrdenCompraEstadoService extends BaseService<OrdenCompraEstado> {
    
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'ordencompraestado'}, httpService);
    }
}