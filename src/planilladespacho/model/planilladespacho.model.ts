import { BaseModel } from "@proguidemc/http-module";
import { OperadorLogico } from "../../shared/operadorlogico/model/operadorlogico.model";
import { PalletVM } from "../../pallet/model/pallet.model";
import { VehiculoVM } from "../../shared/vehiculo/model/vehiculo.model";
import { ChoferVM } from "../../shared/chofer/model/chofer.model";
import { PlanillaDespachoEstado, PlanillaDespachoEstadoEnum } from "./planilladespachoestado.model";
import { Usuario } from "../../planillaarmado/model/plantilla.model";
import { LugarVM } from "../../shared/lugar/model/lugar.model";
import { PlanillaRecepcion } from "../../planillarecepcion/model/planillarecepcion.model";
import { PlanillaRecepcionEstado } from "../../planillarecepcion/model/planillarecepcionestado.model";

export interface PlanillaDespacho extends BaseModel {
	origenid: string,
	usuario: string,
	pallets: string[],
	recepciones: string[],
	idoperador: string,
	idchofer: string,
	idvehiculo: string,
	estado: PlanillaDespachoEstadoEnum
	fechadespacho?: string,
	fechacierre?: string,
}

export interface PlanillaDespachoVM extends Omit<PlanillaDespacho, "recepciones" | "origenid" | "idoperador" | "idchofer" | "idvehiculo" | "pallets" | "estado" | "usuario"> {
  usuario: Usuario,
	operador?: OperadorLogico,
	pallets: PalletVM[],
	chofer?: ChoferVM,
	vehiculo?: VehiculoVM
	estado?: PlanillaDespachoEstado,
	destinos: LugarVM[],
	origen?: LugarVM,
	recepciones?: RecepcionVM[] | string[],
	recepciontotales?: RecepcionTotales;
	viewenabled: boolean;
}

export interface RecepcionTotales {
	confirmadas: number,
	total: number,
}

export interface RecepcionVM extends Omit <PlanillaRecepcion, "recibidopor" | "usuario" | "estado"> {
	origen?: LugarVM,
	destino?: LugarVM,
	estado?: PlanillaRecepcionEstado,
}

// armar interface nuevo para enviar solo los datos para las PD en estado DESPACHADA o CERRADA

export interface PlanillaDespachoCreate extends Omit<PlanillaDespacho, "origen" | "estado"> {
	message?: string;
}