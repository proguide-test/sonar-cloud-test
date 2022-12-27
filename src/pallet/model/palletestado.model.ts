import  { BaseModel } from "@proguidemc/http-module";

export interface PalletEstado extends BaseModel {
    name: string,
    enable: boolean
}

export enum EstadoPalletEnum {
    Generado = 'generado',
    Asignado = 'asignado',
    Liberado = 'liberado',
    Anulado = 'anulado',
    Despachado = 'despachado',
    Recibido = 'recibido',
    Recibidoconincidencias = 'recibidoconincidencias',
}