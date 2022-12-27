import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Vendedor } from './model/vendedor.model';

@Injectable()
export class VendedorService extends BaseFullService<Vendedor> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'vendedor'}, httpService);
    }
}
