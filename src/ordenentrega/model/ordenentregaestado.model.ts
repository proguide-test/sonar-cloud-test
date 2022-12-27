import  { BaseModel } from "@proguidemc/http-module";

export class OrdenEntregaEstado extends BaseModel {
    name!: string;
    enabled!: boolean;
}

export enum OrdenEntregaEstadoEnum {
    Preparacion = 'preparacion',
    Despachada = 'despachada',
    Entregada = 'entregada'
}
