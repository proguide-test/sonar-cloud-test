import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { TipoM } from './model/tipom.model';

@Injectable()
export class TipoMService extends BaseFullService<TipoM> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'tipomaterial'}, httpService);
    }
}
