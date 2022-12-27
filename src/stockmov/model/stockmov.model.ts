import  { BaseModel } from "@proguidemc/http-module";
import { Product } from "../../producto/model/producto.model";
import { LugarVM } from "../../shared/lugar/model/lugar.model";
import { UserInfo } from "../../shared/userconfig/model/userconfig.model";
import { StockMovEnum, StockMovTipo } from "./stockmovtipo.model";

export interface StockMov extends BaseModel {
	usuario: string,
    origenid?: string,
    destinoid?: string,
    materialid?: string,
    tipo: StockMovEnum,
    cantidad: number,  
    fecha: string,
}

export interface StockMovVM extends Omit<StockMov, "usuario" | "origenid" | "destinoid" | "tipo" | "materialid"> {
    usuario?: UserInfo,    
    material?: Product,
    tipo?: StockMovTipo,
    origen?: LugarVM,
    destino?: LugarVM
}
  
export interface StockMovRegister extends Omit<StockMov, "fecha"> {}