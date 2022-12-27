import  { BaseModel } from "@proguidemc/http-module";

export class OrdenTransporteEstado extends BaseModel {
    name!: string;
    enabled!: boolean;
}

export enum OrdenTransporteEstadoEnum {
    EnEdicion = 'edicion',
    Pendiente = 'pendiente',
    Preparacion = 'preparacion',
    Despachada = 'despachada',
    Generada = 'generada',
    CerradaConPendiente = 'cerradaconpendiente',
    Anulada = 'anulada',
    Entregada = 'entregada',
}
