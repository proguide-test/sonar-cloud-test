import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Almacen } from './model/almacen.model';

@Injectable()
export class AlmacenService extends BaseFullService<Almacen> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'almacen'}, httpService);
    }
}
