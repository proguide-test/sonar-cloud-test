import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { TipoA } from './model/tipoarchivo.model';

@Injectable()
export class TipoAService extends BaseFullService<TipoA> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'tipoarchivo'}, httpService);
    }
}
