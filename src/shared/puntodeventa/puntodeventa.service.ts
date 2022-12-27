import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { PuntoDeVenta } from './model/puntodeventa.model';

@Injectable()
export class PuntoDeVentaService extends BaseFullService<PuntoDeVenta> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'puntoventa'}, httpService);
    }
}
