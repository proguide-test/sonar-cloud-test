import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { BaseFullService, DBName } from '@proguidemc/http-module';
import { StockMovTipo } from './model/stockmovtipo.model';

@Injectable()
export class StockMovTipoService extends BaseFullService<StockMovTipo> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'stockmovtipo'}, httpService);
    }
}
