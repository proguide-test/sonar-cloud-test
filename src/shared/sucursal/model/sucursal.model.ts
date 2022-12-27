import  { BaseModel } from "@proguidemc/http-module";

export class Sucursal extends BaseModel {
    name!: string;
    enabled!: boolean;
}