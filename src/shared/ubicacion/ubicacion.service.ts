import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Ubicacion } from './model/ubicacion.model';

@Injectable()
export class UbicacionService extends BaseFullService<Ubicacion> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'ubicacion'}, httpService);
    }
}
