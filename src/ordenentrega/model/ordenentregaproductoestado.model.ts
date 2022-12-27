import  { BaseModel } from "@proguidemc/http-module";

export class OrdenEntregaProductoEstado extends BaseModel {
    id!: OrdenEntregaProductoEstadoEnum;
    name!: string;
    enabled!: boolean;
}

export enum OrdenEntregaProductoEstadoEnum {
    EnPreparacion = 'preparacion',
    Despachado = 'despachado',
    Recibido = 'recibido',
}