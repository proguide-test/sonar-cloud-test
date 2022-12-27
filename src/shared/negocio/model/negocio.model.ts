import  { BaseModel } from "@proguidemc/http-module";

export class Negocio extends BaseModel {
    name!: string;
    descripcion!: string;
    nodopadre!: string;
    codigonuevo!: string;
}