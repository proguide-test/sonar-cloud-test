import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Dimension } from './model/dimension.model';

@Injectable()
export class DimensionService extends BaseFullService<Dimension> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'dimension'}, httpService);
    }
}
