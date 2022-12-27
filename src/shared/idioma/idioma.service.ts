import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Idioma } from './model/idioma.model';

@Injectable()
export class IdiomaService extends BaseFullService<Idioma> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'idioma'}, httpService);
    }
}
