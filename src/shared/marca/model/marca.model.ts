import  { BaseModel } from "@proguidemc/http-module";

export class Marca extends BaseModel {
    name!: string;
    enabled!: boolean;
    image?: string;
}