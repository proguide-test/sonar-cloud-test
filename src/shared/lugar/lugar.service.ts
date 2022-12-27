import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { LugarTipoService } from './lugartipo.service';
import { Lugar } from './model/lugar.model';

@Injectable()
export class LugarService extends BaseFullService<Lugar> {

    constructor(
        protected httpService: HttpService,
        public lugarTipoService: LugarTipoService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'lugar'}, httpService);
    }
    
    async findById(id: string) {
        return this.findOne({id});
    }
    
}
