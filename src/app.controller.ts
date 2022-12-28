import { Body, Controller, Post, Res } from '@nestjs/common';
import { AppService, LoginParams } from './app.service';
import { ApiTags } from '@nestjs/swagger';
import { HttpResponse } from '@proguidemc/http-module';
import { HttpService } from '@nestjs/axios';

@ApiTags("Root")
@Controller()
export class AppController {
    constructor(
        private appService: AppService,
        protected httpService: HttpService,
    ) {}

    @Post('/login')
    async login(
        @Body() payload: LoginParams,
        @Res() response: HttpResponse,
    ) {
        this.appService.login(payload)
        .then(info => {
            response.status(200).send(info);
        })
        .catch(error => {
            response.status(500).send(error);
        });
    }
}
