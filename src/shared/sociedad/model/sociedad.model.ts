import  { BaseModel } from "@proguidemc/http-module";

export class Sociedad extends BaseModel {
    name!: string;
    codigosap!: string;
    enabled!: boolean;
}