import  { BaseModel } from "@proguidemc/http-module";

export enum OrdenEntregaMotivoEnum {
    Diferencias = 'condiferencias',
    Rotura = 'rotura',
    Perdida = 'perdida',
    Devolucion = 'devolucion',
}

export class OrdenEntregaMotivo extends BaseModel {
    name!: string;
    enabled!: boolean;    
}