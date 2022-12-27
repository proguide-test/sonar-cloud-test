import  { BaseModel } from "@proguidemc/http-module";

export class Almacen extends BaseModel {
    name!: string;
    enabled!: boolean;
    codigosap!: string;
    centroid!: string;
}