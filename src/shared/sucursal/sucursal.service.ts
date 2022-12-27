import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Sucursal } from './model/sucursal.model';

@Injectable()
export class SucursalService extends BaseFullService<Sucursal> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'sucursal'}, httpService);
    }
}
