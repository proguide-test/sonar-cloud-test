import  { BaseModel } from "@proguidemc/http-module";

export class Pais extends BaseModel {
    name!: string;
    enabled!: boolean;
    abreviatura!: string;
}