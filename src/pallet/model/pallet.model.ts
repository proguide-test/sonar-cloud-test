import  { BaseModel } from "@proguidemc/http-module";
import { OrdenTransporteVM } from "../../ordentransporte/model/ordentransporte.model";
import { Usuario } from "../../planillaarmado/model/plantilla.model";
import { Product } from "../../producto/model/producto.model";
import { Lugar, LugarVM } from "../../shared/lugar/model/lugar.model";
import { EstadoPalletEnum, PalletEstado } from "./palletestado.model";

export interface ProductoPalletTipoMotivo {
	sobrante: number,
	rotura: number,
	faltante: number,
	observacion: string,	
}

export interface Pallet extends BaseModel {
    productos: ProductoPallet[],
    estado: EstadoPalletEnum,
    origenid: string,
    destinoid: string,
    nroplanilladespacho?: string,
    anuladopor?: {
        userid: string,
        fecha: Date
    }
    chep: boolean,
    nroplanillarecepcion?: string,
    usuario: string,
}

export interface ProductoPallet {
    // Con el ID ordentransporte obtenes plan y destino.
    ordentransporteid: string,
    // Con el ID producto obtenes descripcion y codigo material.
    productoid: string,
    cantidad: number,
    deleted?: boolean,
    cantidadrecibida?: number,
    motivo?: ProductoPalletTipoMotivo,
}

export interface PalletCount extends BaseModel {
    count: number, 
    productos?: ProductoPalletVM[], 
    destino?: Lugar,
    estado?: PalletEstado,
}

export interface PalletVM extends Omit<Pallet, 'origenid' | 'productos' | 'estado' | 'destinoid' | 'usuario'> {
    productos: ProductoPalletVM[],
    estado?: PalletEstado,
    destino?: LugarVM,
    origen?: LugarVM,
    viewenabled: boolean,
    usuario?: Usuario,
}

export interface ProductoPalletVM extends ProductoPallet{
    producto?: Product,
    ordentransporte?: OrdenTransporteVM,
}

export interface ProductoPalletRequest {
    ordentransporteid: string,
    productoid: string,
    cantidad: number,
}