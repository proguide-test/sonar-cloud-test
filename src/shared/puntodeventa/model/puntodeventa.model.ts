import  { BaseModel } from "@proguidemc/http-module";

export class PuntoDeVenta extends BaseModel {
    name!: string;
    centrodistribucionid!: string;
    regionid!: string;
    direccion!: string;
    vendedor!: string;
    supervisor!: string;
    jefeventas!: string
}
