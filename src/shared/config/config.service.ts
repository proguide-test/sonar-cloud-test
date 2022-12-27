import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Config } from './model/config.model';

@Injectable()
export class ConfigService extends BaseFullService<Config> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'config'}, httpService);
    }

    async find(name: string, defaultValue?: any): Promise<any> {
        const item = await this.findOne({name});
        if (!item?.value) return defaultValue;
        return item.value;
    }
}
