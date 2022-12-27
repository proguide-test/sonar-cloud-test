import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { LugarTipo } from './model/lugartipo.model';

@Injectable()
export class LugarTipoService extends BaseFullService<LugarTipo> {
    constructor(
        protected httpService: HttpService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'lugartipo'}, httpService);
    }
}
