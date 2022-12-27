import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Centro } from './model/centro.model';

@Injectable()
export class CentroService extends BaseFullService<Centro> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'centro'}, httpService);
    }
}
