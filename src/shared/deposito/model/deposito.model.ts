import  { BaseModel } from "@proguidemc/http-module";

export class Deposito extends BaseModel {
    name!: string;
    enabled!: boolean;
    direccion!: string;
    regionid!: string;
    codigosap!: string;
}