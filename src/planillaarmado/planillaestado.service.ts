import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { PlanillaArmadoEstado } from './model/planillaestado.model';

@Injectable()
export class PlanillaEstadoService extends BaseFullService<PlanillaArmadoEstado> {
    
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'planillaarmadoestado'}, httpService);
    }
}