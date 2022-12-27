import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { CarritoEstado } from './model/carritoestado.model';
import { DBName, BaseFullService } from '@proguidemc/http-module';

@Injectable()
export class CarritoEstadoService extends BaseFullService<CarritoEstado> {
    
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'carritoestado'}, httpService);
    }
}