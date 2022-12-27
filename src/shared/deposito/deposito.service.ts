import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Deposito } from './model/deposito.model';

@Injectable()
export class DepositoService extends BaseFullService<Deposito> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'deposito'}, httpService);
    }
}
