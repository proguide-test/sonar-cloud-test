import  { BaseModel } from "@proguidemc/http-module";

export class CentroDistribucion extends BaseModel {
    name!: string;
    enabled!: boolean;
    direccion!: string;
    regionid!: string;
    codigosap!: string;
}