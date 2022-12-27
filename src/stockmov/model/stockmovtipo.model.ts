import  { BaseModel } from "@proguidemc/http-module";

export interface StockMovTipo extends BaseModel {
    name: string;
    enabled: boolean;
}

export enum StockMovEnum {
    ingreso = 'ingreso',
    reserva = 'reserva',
    transito = 'transito',
}
