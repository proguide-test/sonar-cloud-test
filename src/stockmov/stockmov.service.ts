import { HttpService } from '@nestjs/axios';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Product } from '../producto/model/producto.model';
import { ProductService } from '../producto/producto.service';
import { DBName, BaseFullService, JwtPayload } from '@proguidemc/http-module';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { ArrayList, arraySorted, errorFn, formatDate, getFilterDate, parseNumber } from '../shared/utils/utils';
import { StockMov, StockMovRegister, StockMovVM } from './model/stockmov.model';
import { StockMovTipo } from './model/stockmovtipo.model';
import { StockMovTipoService } from './stockmovtipo.service';
import { UserInfo } from '../shared/userconfig/model/userconfig.model';

@Injectable()
export class StockMovService extends BaseFullService<StockMov> {
    constructor(
        protected httpService: HttpService,
        protected stockMovTipoService: StockMovTipoService,
        @Inject(forwardRef(() => ProductService)) public productService: ProductService,        
        protected userConfigService: UserConfigService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'stockmov'}, httpService);
    }

    async get(user: JwtPayload, from?: string, to?: string, id?: string): Promise<StockMovVM[]> {
        const filter: any = {};
        filter["fecha"] = getFilterDate(from, to);
        if (id) {
            filter["materialid"] = id;
        }
        
        const userInfo = await this.userConfigService.get(user.userId);
        if (userInfo.origenesid.length == 0) return [];

        filter["$or"] = [
            {"origenid": {$in : userInfo.origenesid}},
            {"destinoid": {$in : userInfo.origenesid}},
        ];

        const tipos: StockMovTipo[] = [];
        const movs: StockMov[] = [];
        
        await Promise.all([
            this.stockMovTipoService.findAll({}),
            this.findAll(filter),
        ])
        .then(responses => {
            tipos.push(...responses[0]);
            movs.push(...responses[1]);
        })
        .catch(errorFn);
        
        const productoIds = new ArrayList();
        const usuarioIds = new ArrayList();

        movs.forEach(item => {
            productoIds.push(item.materialid);
            usuarioIds.push(item.usuario);        
        });

        if (productoIds.count() == 0 || usuarioIds.count() == 0) return [];

        const productos: Product[] = [];
        const usuarios: UserInfo[] = [];
        
        await Promise.all([
            this.productService.findAll({codigosap: {$in: productoIds.get()}}),
            this.productService.userConfigService.findUsers({username: {$in: usuarioIds.get()}}),
        ])
        .then(responses => {
            productos.push(...responses[0]);
            usuarios.push(...responses[1].map(i => {
                return {
                    id: i.id,
                    username: i.username,
                    email: i.email,
                    firstName: i.firstName,
                    lastName: i.lastName,
                }
            }));
        })
        .catch(errorFn);

        const resp: StockMovVM[] = [];
        
        const lugarIds = new ArrayList();
        movs.forEach(item => {
            lugarIds.push(item.origenid);
            lugarIds.push(item.destinoid);        
        });

        const lugares = await this.userConfigService.getInfoEntities(lugarIds.get());

        movs.forEach(item => {
            const usuario = usuarios.find(i => i.username == item.usuario);            
            resp.push({
                ...item,
                cantidad: parseNumber(item.cantidad),
                material: productos.find(i => i.codigosap == item.materialid),
                tipo: tipos.find(i => i.id == item.tipo),
                usuario,
                origen: lugares.find(i => i.id == item.origenid),
                destino: lugares.find(i => i.id == item.destinoid),
            });
        })

        return arraySorted(resp, "fecha");
    }
    
    register(item: StockMovRegister): Promise<StockMov | undefined> {
        return new Promise(async resolve => {
            const newItem: StockMov = {
                ...item,
                cantidad: parseNumber(item.cantidad),
                fecha: formatDate(new Date(), 0, false, '-'),
            };
            
            const faileditem = (
                newItem.cantidad <= 0 || 
                !newItem.origenid || 
                !newItem.destinoid || 
                !newItem.materialid || 
                !newItem.tipo || 
                !newItem.usuario
            )
            
            const resp = faileditem ? undefined : await this.create(newItem).catch(errorFn);
            resolve(resp || undefined);
        });
    }
}
