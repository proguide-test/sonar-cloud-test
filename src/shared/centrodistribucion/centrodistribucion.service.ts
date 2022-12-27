import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { CentroDistribucion } from './model/centrodistribucion.model';

@Injectable()
export class CentroDistribucionService extends BaseFullService<CentroDistribucion> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'centrodistribucion'}, httpService);
    }
}
