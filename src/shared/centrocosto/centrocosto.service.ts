import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Centrocosto } from './model/centrocosto.model';

@Injectable()
export class CentrocostoService extends BaseFullService<Centrocosto> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'centrocosto'}, httpService);
    }
}
