import  { BaseModel } from "@proguidemc/http-module";

export interface Vehiculo extends BaseModel {
	patente: string;
	tipovehiculo: TipoVehiculoEnum;
    subtipo?: SubtipoCamionEnum;
	posiciones?: number;
    empresa?: string;
}

export enum TipoVehiculoEnum {
    camion = 'camion',
    camioneta = 'camioneta',
    auto = 'auto',
    moto = 'moto',
    bici = 'bici',
}

export enum SubtipoCamionEnum {
    lechero = 'lechero',
    interplanta = 'interplanta',
    directo = 'directo',
    distribuidor = 'distribuidor',
    arcoylona = 'arcoylona',
    escalable1 = 'escalable1',
    escalable2 = 'escalable2',
    sider = 'sider',
    tradicional = 'tradicional',
    ultraliviano = 'ultraliviano'
}

export interface VehiculoVM extends Omit<Vehiculo, "subtipo"> {
    subtipo: {
        id?: string,
        name: string
    }
}