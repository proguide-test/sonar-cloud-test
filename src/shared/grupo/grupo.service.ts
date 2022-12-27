import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Grupo } from './model/grupo.model';

@Injectable()
export class GrupoService extends BaseFullService<Grupo> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'grupo'}, httpService);
    }
}
