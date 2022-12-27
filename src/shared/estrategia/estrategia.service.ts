import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Estrategia } from './model/estrategia.model';

@Injectable()
export class EstrategiaService extends BaseFullService<Estrategia> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'estrategia'}, httpService);
    }
}
