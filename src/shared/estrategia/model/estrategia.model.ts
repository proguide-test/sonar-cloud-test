import  { BaseModel } from "@proguidemc/http-module";

export class Estrategia extends BaseModel {
    name!: string;
    enabled!: boolean;
    codigosap!: string;
}