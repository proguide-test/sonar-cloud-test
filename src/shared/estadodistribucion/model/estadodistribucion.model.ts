import  { BaseModel } from "@proguidemc/http-module";

export class EstadoDistribucion extends BaseModel {
    name!: string;
    enabled!: boolean;
}

export enum DistribucionEstado {
    Listo = 'LI',
    PendienteAsignacion = 'PD',
    Enviada = 'EN',
    Recibida = 'RE',
    PendienteAjuste = 'PA',
    Aceptada = 'AC',
}