import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Distribuidor } from './model/distribuidor.model';

@Injectable()
export class DistribuidorService extends BaseFullService<Distribuidor> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'distribuidor'}, httpService);
    }
}
