import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { PlanillaRecepcionEstado } from './model/planillarecepcionestado.model';

@Injectable()
export class PlanillaRecepcionEstadoService extends BaseFullService<PlanillaRecepcionEstado> {
    
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'planillarecepcionestado'}, httpService);
    }
}