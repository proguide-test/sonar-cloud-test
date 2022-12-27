import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { CarritoPostergadoService } from '../carrito/carritopostergado/carritopostergado.service';
import { ConfigService } from '../shared/config/config.service';
import { Carritomov } from './model/carritomov.model';

@Injectable()
export class CarritomovService extends BaseFullService<Carritomov> {
    constructor(
        protected httpService: HttpService,
        public configService: ConfigService,
        public carritoPostergadoService: CarritoPostergadoService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'carritomov'}, httpService);
    }
}
