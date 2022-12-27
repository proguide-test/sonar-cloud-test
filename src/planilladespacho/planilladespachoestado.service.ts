import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { PlanillaDespachoEstado } from './model/planilladespachoestado.model';

@Injectable()
export class PlanillaDespachoEstadoService extends BaseFullService<PlanillaDespachoEstado> {
    
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'planilladespachoestado'}, httpService);
    }
}