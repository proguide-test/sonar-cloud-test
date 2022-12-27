import  { BaseModel } from "@proguidemc/http-module";

export class Cuenta extends BaseModel {
    name!: string;
    enabled!: boolean;
}