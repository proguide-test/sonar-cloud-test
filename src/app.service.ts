import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { configurationGet, FlexService } from '@proguidemc/http-module';

@Injectable()   
export class AppService extends FlexService {

  constructor (protected httpService: HttpService) {
    super(AppService.name, httpService);
  }

  login(info: LoginParams): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!info?.username || !info?.password) return reject({message: "Invalid Request"});
      resolve(info);
    });
  }

  getHello(): string {
    return 'Shopping API. Version: ' + configurationGet("BRANCHNAME");
  }
}

export interface LoginParams {
  username: string;
  password: string;
}
