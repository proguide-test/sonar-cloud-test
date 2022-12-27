import  { BaseModel } from "@proguidemc/http-module";
import { PlanillaArmadoEstado, PlanillaArmadoEstadoEnum } from "./planillaestado.model";
import { OrdenTransporteVM } from "../../ordentransporte/model/ordentransporte.model";
import { PalletVM } from "../../pallet/model/pallet.model";
import { LugarVM } from "../../shared/lugar/model/lugar.model";

export interface PlanillaArmado extends BaseModel {
    usuario: string;
    estado: PlanillaArmadoEstadoEnum;
    // Id de orden de tranposrte, productosExluidos (si es vacio, incluye todos los prods de la orden).
    ordenestransporte: OrdenEnPlanillaArmado[];
    origenid: string;
    pallets: string[];
}

export interface PlanillaArmadoVM extends Omit<PlanillaArmado, "origenid" | "usuario" | "estado" | "ordenestransporte" | "pallets"> {
    usuario: Usuario;
    destino: LugarVM[];
    origen?: LugarVM;
    estado?: PlanillaArmadoEstado;
    ordenestransporte?: OrdenTransporteVM[];
    pallets?: PalletVM[];
    viewenabled: boolean;
}

export interface Usuario extends BaseModel {
    username: string;
    [value: string]: any;
}

export interface OrdenEnPlanillaArmado {   
    id: string, 
    productosExcluidos: string[]
}