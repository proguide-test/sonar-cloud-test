import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { TableBuffer } from './model/tablebuffer.model';

@Injectable()
export class TableBufferService extends BaseFullService<TableBuffer> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'tablebuffer'}, httpService);
    }

    async insert(tableBuffer: TableBuffer[], username: string): Promise<any> {
        return new Promise(async (resolve, rejects) => {
            await this.deleteMany({usuario: username});
            if (Array.isArray(tableBuffer) && tableBuffer.length > 0) {
                this.createMany(tableBuffer.map(i => ({...i, usuario: username})))
                .then(createRes => {
                    if (!createRes) return rejects({message: "Error al crear buffers de tablas."})
                    return resolve({message: "Buffers de tablas creados exitosamente"});
                })
            }
            resolve({message: ""});
        });
    }
}
