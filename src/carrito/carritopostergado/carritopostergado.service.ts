import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { CarritoPostergado, DistribucionInfoPostergado } from './model/carritopostergado.model';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Cart } from '../model/cart.model';
import { toString } from '../../shared/utils/utils';

@Injectable()
export class CarritoPostergadoService extends BaseFullService<CarritoPostergado> {
    
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'carritopostergado'}, httpService);
    }

    async addTo(carrito: Cart, idproducto: string, userName: string): Promise<boolean> {
        const producto: DistribucionInfoPostergado | undefined = Array.isArray(carrito?.productos) ? carrito.productos.find(i => i.id == idproducto) : undefined;
        if (!producto) return false;
        producto.username = userName;

        let resp: CarritoPostergado | undefined;
        const item = await this.findOne({carritoid: carrito.id});
        if (!item?.id) {
            const newItem: CarritoPostergado = {
                ...carrito,
                carritoid: toString(carrito.id),
                productos: [producto]
            }
            delete newItem.id;
            delete newItem._id;
            resp = await this.create(newItem);
        } else {
            if (!Array.isArray(item.productos)) item.productos = [];
            const index = item.productos.findIndex(i => i.id == idproducto);
            if (index >= 0) {
                item.productos[index] = producto;
            } else {
                item.productos.push(producto);
            }
            if (await this.update(item.id, {productos: item.productos})) {
                resp = item;
            }
        }

        if (resp?.id) return true;
        return false;
    }
}