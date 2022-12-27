import  { BaseModel } from "@proguidemc/http-module";

export class PlanillaArmadoEstado extends BaseModel {
    name!: string;
    enabled!: boolean;
}

export enum PlanillaArmadoEstadoEnum {
    Generada = 'generada',
    Paletizada = 'paletizada',
    Despachado = 'despachado',
    Anulada = 'anulada'
}