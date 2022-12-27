import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Localidad } from './model/localidad.model';

@Injectable()
export class LocalidadService extends BaseFullService<Localidad> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'localidad'}, httpService);
    }
}
