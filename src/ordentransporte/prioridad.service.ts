import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { BaseFullService, DBName } from '@proguidemc/http-module';
import { Prioridad } from './model/prioridad.model';

@Injectable()
export class PrioridadService extends BaseFullService<Prioridad> {
    constructor(
        protected httpService: HttpService,      
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'ordentransporteprioridad'}, httpService);
    }
}