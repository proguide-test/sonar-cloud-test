import { BaseModel } from "@proguidemc/http-module";

export class PlanillaDespachoEstado extends BaseModel {
    name!: string;
    enabled!: boolean;
}

export enum PlanillaDespachoEstadoEnum {
    Generada = 'generada',
    Anulada = 'anulada',
    Despachada = 'despachada',
    Cerrada = 'cerrada'
}