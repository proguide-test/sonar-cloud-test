import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Negocio } from './model/negocio.model';

@Injectable()
export class NegocioService extends BaseFullService<Negocio> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'negocio'}, httpService);
    }
}
