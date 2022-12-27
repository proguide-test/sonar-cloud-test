import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { PalletEstado } from './model/palletestado.model';

@Injectable()
export class PalletEstadoService extends BaseFullService<PalletEstado> {
    constructor(
        protected httpService: HttpService,
        protected userConfigService: UserConfigService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'palletestado'}, httpService);
    }

}