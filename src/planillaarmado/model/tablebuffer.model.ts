import  { BaseModel } from "@proguidemc/http-module";

export class TableBuffer extends BaseModel {
    usuario!: string;
    ordentransporteid!: string;
    productoid!: string;
    cantidad!: number; // Cantidad a paletizar
}