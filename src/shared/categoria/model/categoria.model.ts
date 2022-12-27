import  { BaseModel } from "@proguidemc/http-module";

export class Categoria extends BaseModel {
    name!: string;
    enabled!: boolean;
    image?: string;
}