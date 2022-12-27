import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Supervisor } from './model/supervisor.model';

@Injectable()
export class SupervisorService extends BaseFullService<Supervisor> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'supervisor'}, httpService);
    }
}
