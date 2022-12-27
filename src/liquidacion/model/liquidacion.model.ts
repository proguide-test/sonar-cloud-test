import  { BaseModel } from "@proguidemc/http-module";
import { Usuario } from "../../planillaarmado/model/plantilla.model";
import { LugarVM } from "../../shared/lugar/model/lugar.model";
import { OperadorLogico } from "../../shared/operadorlogico/model/operadorlogico.model";

export interface Liquidacion extends BaseModel {
    usuario: string;
    importe: number;
    fromperiodo: string;
    toperiodo: string;
    recepciones: string[];
    cantidad?: number;
}

export interface LiquidacionVM extends Omit<Liquidacion, "usuario" | "recepciones"> {
    usuario?: Usuario;
    recepciones?: PlanillaRecepcionALiquidar[];
}

export interface PlanillaRecepcionALiquidar {
    idplanilla: string;
    planillarecepcionnro: string;
    planilladespachonro?: string;
    operador?: OperadorLogico;
    origen?: LugarVM;
    destino?: LugarVM;
    pos: number;
    valores: ValoresLiquidacion;
}

export interface ValoresLiquidacion {
    fijo: number;
    complementario: number;
    total: number;
}