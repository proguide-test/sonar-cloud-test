import  { BaseModel } from "@proguidemc/http-module";

export class Carritomov extends BaseModel {
    idcarrito!: string;
    idproducto!: string;
    idproveedor!: string;
    usuario!: string;
    preciounitario!: number;
    diasproduccion!: number;
}