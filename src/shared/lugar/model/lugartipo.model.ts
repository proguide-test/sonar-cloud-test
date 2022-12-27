import  { BaseModel } from "@proguidemc/http-module";

export interface LugarTipo extends BaseModel {
    name : string;
    enabled?: boolean;
    abreviatura?: string;
}

export enum LugarTipoEnum {
    Deposito = 'deposito',
    Centro = 'centro',
    Planta = 'planta',
    Directa = 'directa',
    Distribuidor = 'distribuidor',
    PuntoVenta = 'puntoventa',
}