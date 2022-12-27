import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Provincia } from './model/provincia.model';

@Injectable()
export class ProvinciaService extends BaseFullService<Provincia> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'provincia'}, httpService);
    }
}
