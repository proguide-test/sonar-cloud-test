import  { BaseModel } from "@proguidemc/http-module";

export class Vendedor extends BaseModel {
    name!: string; 
    enabled!: boolean;
}