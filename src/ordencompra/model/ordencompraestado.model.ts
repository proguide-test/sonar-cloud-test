import  { BaseModel } from "@proguidemc/http-module";

export class OrdenCompraEstado extends BaseModel {
    name!: string;
    enabled!: boolean;
}

export enum OrdenCompraEstadoEnum {
    Solicitada = 'solicitada',
    Aprobada = 'aprobada',   
    Emitida = 'emitida',     
    Confirmada = 'confirmada',
}