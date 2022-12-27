import  { BaseModel } from "@proguidemc/http-module";

export interface OperadorLogico extends BaseModel {
	cuit: string,
	nombre: string,
	direccion: string
}