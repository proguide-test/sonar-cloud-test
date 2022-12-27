import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Categoria } from './model/categoria.model';

@Injectable()
export class CategoriaService extends BaseFullService<Categoria> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'categoria'}, httpService);
    }
}
