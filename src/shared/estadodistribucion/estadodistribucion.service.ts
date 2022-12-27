import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { EstadoDistribucion } from './model/estadodistribucion.model';

@Injectable()
export class EstadoDistribucionService extends BaseFullService<EstadoDistribucion> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'estadodistribucion'}, httpService);
    }    
}
