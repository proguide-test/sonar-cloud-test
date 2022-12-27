import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Cuenta } from './model/cuenta.model';

@Injectable()
export class CuentaService extends BaseFullService<Cuenta> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'cuenta'}, httpService);
    }
}
