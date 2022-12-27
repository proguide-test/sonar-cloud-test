import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { OperadorLogico } from './model/operadorlogico.model';

@Injectable()
export class OperadorLogicoService extends BaseFullService<OperadorLogico> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'operadorlogico'}, httpService);
    }
}
