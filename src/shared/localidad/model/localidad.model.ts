import  { BaseModel } from "@proguidemc/http-module";
import { Provincia } from "../../provincia/model/provincia.model";

export class Localidad extends BaseModel {
    name!: string;
    provinciaid!: string;
    codigo?: string;
    codpostal?: string;
    enabled!: boolean;
}

export class LocalidadVM extends Localidad {
    provincia?: Provincia;
}