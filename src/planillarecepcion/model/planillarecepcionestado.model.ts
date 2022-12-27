import { BaseModel } from "@proguidemc/http-module";

export class PlanillaRecepcionEstado extends BaseModel {
    id?: PlanillaRecepcionEstadoEnum;
    name!: string;
    enabled!: boolean;
}

export enum PlanillaRecepcionEstadoEnum {
    EnTransito = 'entransito',
    Entregaparcial = 'entregaparcial',
    Entregatotal = 'entregatotal',
    EnRecepcion = 'enrecepcion'
}