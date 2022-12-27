import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseFullService } from '@proguidemc/http-module';
import { Vehiculo, TipoVehiculoEnum, VehiculoVM, SubtipoCamionEnum } from './model/vehiculo.model';

@Injectable()
export class VehiculoService extends BaseFullService<Vehiculo> {
    constructor(protected httpService: HttpService) {
        super({dbname: DBName.ShoppingManager, tablename: 'vehiculo'}, httpService);
    }

    getVehicle(tipovehiculo?: TipoVehiculoEnum): Promise<VehiculoVM[]> {
        return new Promise(async (resolve) => {
            const vehiculos = tipovehiculo ? await this.findAll({tipovehiculo: tipovehiculo}) : await this.findAll({});
            return resolve(this.normalize(vehiculos));
        });
    }

    normalize(vehiculos: Vehiculo[]) : VehiculoVM[] {
        if (!Array.isArray(vehiculos) || vehiculos.length === 0) return [];
        const vehiculosVM: VehiculoVM[] = [];
        for (let i = 0; i < vehiculos.length; i++) {
            const vehiculo = vehiculos[i];
            let vehiculoVM: VehiculoVM | undefined = undefined; 
            switch(vehiculo.tipovehiculo) {
                case TipoVehiculoEnum.camion:
                    if (!vehiculo.subtipo) break;
                    const subtipoVM = {
                        id: vehiculo.subtipo,
                        name: ''
                    }
                    if (vehiculo.subtipo === SubtipoCamionEnum.directo) subtipoVM.name = 'Directo';
                    else if (vehiculo.subtipo === SubtipoCamionEnum.distribuidor) subtipoVM.name = 'Distribuidor';
                    else if (vehiculo.subtipo === SubtipoCamionEnum.lechero) subtipoVM.name = 'Lechero';
                    else if (vehiculo.subtipo === SubtipoCamionEnum.interplanta) subtipoVM.name = 'Interplanta';
                    vehiculoVM = {
                        ...vehiculos[i],
                        subtipo: subtipoVM
                    }
                    break;
                default:
                    if (!vehiculo.subtipo) break;
                    vehiculoVM = {
                        ...vehiculos[i],
                        subtipo: {
                            id: vehiculos[i].subtipo,
                            name: ''
                        }
                    }
                    break;
            }
            if (vehiculoVM) vehiculosVM.push(vehiculoVM);
        }
        return vehiculosVM;
    }
}
