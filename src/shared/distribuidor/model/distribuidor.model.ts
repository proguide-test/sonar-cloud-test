import  { BaseModel } from "@proguidemc/http-module";

export class Distribuidor extends BaseModel {
    name!: string;
    direccion!: string;
    regionid!: string;
}