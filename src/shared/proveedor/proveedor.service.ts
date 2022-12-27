import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Proveedor } from './model/proveedor.model';

@Injectable()
export class ProveedorService extends BaseFullService<Proveedor> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'proveedor'}, httpService);
    }
}
