import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Chofer, ChoferVM } from './model/chofer.model';
import { convertImages } from '../utils/utils';

@Injectable()
export class ChoferService extends BaseFullService<Chofer> {
    constructor(
        protected httpService: HttpService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'chofer'}, httpService);
    }    
    
    async getAll(){
        const items = await this.findAll({});
        return this.normalize(items);
    }
    
    normalize(chofers: Chofer[]): ChoferVM[] {
        if(!Array.isArray(chofers) || chofers.length === 0) return[];
        const chofersVM: ChoferVM[] = [];
        chofers.forEach((item) => {
            chofersVM.push({
                ...item,
                nombrecompleto: `${item.nombre} ${item.apellido}`,
                foto: convertImages(item.foto, false)
            });
        })
        return chofersVM;
    }
}