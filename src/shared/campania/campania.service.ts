import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Campania } from './model/campania.model';

@Injectable()
export class CampaniaService extends BaseFullService<Campania> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'campania'}, httpService);
    }
}
