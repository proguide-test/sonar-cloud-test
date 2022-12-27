import  { BaseModel } from "@proguidemc/http-module";

export class Proveedor extends BaseModel {
    codigosap!: string;
    name!: string;
    namec!: string;
    domicilioe!: string;
    enabled!: boolean;
    cuit!: string;
    razonsocial!: string;
    telefonoe!: string;
    localidadide!: string; 
    provinciaide!: string; 
    materialidadid!: string[] | string;  
    tipomaterialid!: string; 
    telefonoc!: string; 
    emailc!: string; 
    cargo!: string;

}
