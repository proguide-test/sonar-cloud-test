import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Cadena } from './model/cadena.model';

@Injectable()
export class CadenaService extends BaseFullService<Cadena> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'cadena'}, httpService);
    }
}
