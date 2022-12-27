import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Pais } from './model/pais.model';

@Injectable()
export class PaisService extends BaseFullService<Pais> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'pais'}, httpService);
    }
}
