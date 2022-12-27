import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Subcadena } from './model/subcadena.model';

@Injectable()
export class SubcadenaService extends BaseFullService<Subcadena> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'subcadena'}, httpService);
    }
}
