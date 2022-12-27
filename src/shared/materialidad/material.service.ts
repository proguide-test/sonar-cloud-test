import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Material } from './model/material.model';

@Injectable()
export class MaterialService extends BaseFullService<Material> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'materialidad'}, httpService);
    }
}
