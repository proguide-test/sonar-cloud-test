import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Canal } from './model/canal.model';

@Injectable()
export class CanalService extends BaseFullService<Canal> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'canal'}, httpService);
    }
}
