import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Plan } from './model/plan.model';

@Injectable()
export class PlanService extends BaseFullService<Plan> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'plan'}, httpService);
    }
}
