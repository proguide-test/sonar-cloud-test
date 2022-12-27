import  { BaseModel } from "@proguidemc/http-module";

export interface Chofer extends BaseModel {
  id: string,
	dni: string,
	tipocarnet?: TipoCarnet,
	nombre: string,
	apellido?: string,
  foto?: string
}

export interface ChoferVM extends Chofer {
  nombrecompleto: string
}

export type TipoCarnet = 'C' | 'C1' | 'C2' | 'C3';