import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { OrdenEntregaMotivo } from './model/ordenentregamotivo.model';

@Injectable()
export class OrdenEntregaMotivoService extends BaseFullService<OrdenEntregaMotivo> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'ordenentregamotivo'}, httpService);
    }
}
