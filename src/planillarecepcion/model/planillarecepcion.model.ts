import { BaseModel } from "@proguidemc/http-module";
import { ProductoPalletTipoMotivo } from "../../pallet/model/pallet.model";
import { Usuario } from "../../planillaarmado/model/plantilla.model";
import { PlanillaDespachoVM } from "../../planilladespacho/model/planilladespacho.model";
import { LugarVM } from "../../shared/lugar/model/lugar.model";
import { PlanillaRecepcionEstado, PlanillaRecepcionEstadoEnum } from "./planillarecepcionestado.model";

export interface PlanillaRecepcion extends BaseModel {
	origenid: string,
	destinoid: string,
	nroplanilladespacho?: string,
	planillaid?: string,
	usuario: string,
	recibidopor?: string,
	estado: PlanillaRecepcionEstadoEnum,
	productos: PlanillaRecepcionProducto[],
	infosap?: {
		nrocomercial: string,
		nrodoc: string,
	}
	fecharecepcion?: string,
	liquidacionid?: string,
	entregaregistrada?: boolean
}

export interface PlanillaRecepcionVM extends Omit<PlanillaRecepcion, "recibidopor" | "productos" | "origenid" | "destinoid" | "planillaid" | "usuario" | "estado"> {
	origen?: LugarVM,
	destino?: LugarVM,
	nroplanilladespacho?: string,
	planilla?: PlanillaDespachoVM,
	usuario?: Usuario,
	recibidopor?: Usuario,
	estado?: PlanillaRecepcionEstado,
	productos: PlanillaRecepcionProductoVM[],
	viewenabled: boolean;
}

export interface PlanillaRecepcionProducto {
	cantidad: number,
	cantidadrecibida?: number,
	idpallet?: string,
	idproducto: string,
	motivo?: ProductoPalletTipoMotivo,
	nroordentransporte: string,
	nropallet?: string,
	plan?: string,
	ordentransporteid: string,
	recibido?: boolean,
}

export interface PlanillaRecepcionProductoVM extends PlanillaRecepcionProducto {
	producto: string,
	codigotruck?: string
}
