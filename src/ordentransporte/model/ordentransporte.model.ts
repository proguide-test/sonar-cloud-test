import  { BaseModel } from "@proguidemc/http-module";
import { Product } from "../../producto/model/producto.model";
import { OrdenTransporteEstado, OrdenTransporteEstadoEnum } from "./ordentransporteestado.model";
import { Plan } from "../../shared/plan/model/plan.model";
import { LugarVM } from "../../shared/lugar/model/lugar.model";
import { Prioridad } from "./prioridad.model";

export interface OrdenTransporte extends BaseModel {
    fechaestimada: string;
    fechaentrega?: string;
    usuario: string;
    puntoventa: string;
    estado: OrdenTransporteEstadoEnum;
    planid: string;
    origenid: string;
    destinoid: string;
    productos: OrdenTransporteItem[];
    bloqueadopor?: string;
    fechacierre?: string;
    fechaanulacion?: string;
    nroordencompra: string;
    prioridadid: string,
    fechaproveedor: string,
}

export interface OrdenTransporteItem {
    productoid: string;
    cantidadtotal: number;
    cantidaddisponible: number;
}

export interface OrdenTransporteVM extends Omit<OrdenTransporte, "origenid" | "destinoid" | "estado" | "productos"> {
    fechaactual: string;
    plan?: Plan;    
    estado?: OrdenTransporteEstado;
    productos: OrdenTransporteItemVM[];
    origen?: LugarVM,
    destino?: LugarVM,
    closeenabled: boolean,
    viewenabled: boolean,
    prioridad?: Prioridad,
}

export interface OrdenTransporteItemVM extends OrdenTransporteItem {
    producto?: Product;
    cantidad?: number;
    codigotruck?: string
}
