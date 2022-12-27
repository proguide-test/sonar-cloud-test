import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { TipoP } from './model/tipop.model';

@Injectable()
export class TipoPService extends BaseFullService<TipoP> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'tipoprecio'}, httpService);
    }
}
