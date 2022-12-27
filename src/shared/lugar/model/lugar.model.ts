import  { BaseModel } from "@proguidemc/http-module";
import { Cadena } from "../../cadena/model/cadena.model";
import { Canal } from "../../canal/model/canal.model";
import { LocalidadVM } from "../../localidad/model/localidad.model";
import { Subcadena } from "../../subcadena/model/subcadena.model";
import { Sucursal } from "../../sucursal/model/sucursal.model";
import { LugarTipo, LugarTipoEnum } from "./lugartipo.model";

export interface Lugar extends BaseModel {
    codigosap?: string;
    name : string;
    regionid: string;
    localidadid: string;
    direccion: string;
    enabled : boolean;
    tipo: LugarTipoEnum;
    // Especifico de TIPO "distribuidor" o "directa"
    cuit?: string;
    encargado?: string;
    contacto?: string;

    // Especifico de TIPO Punto Venta
    canalid?: string;
    vendealcohol?: boolean;
    licenciaalcohol?: string;
    cadenaid?: string;
    subcadenaid?: string;
    sucursalid?: string;

    recibede?: string[]; // ID de lugares desde donde pueden recibir como destino
}

export interface LugarVM extends Omit<Lugar, "tipo"> {
    regionabreviatura?: string;
    regionnombre: string;
    localidad?: LocalidadVM;
    tipo?: LugarTipo;
    canal?: Canal;
    cadena?: Cadena;
    subcadena?: Subcadena;
    sucursal?: Sucursal;
    recibe?: LugarVM[];
}