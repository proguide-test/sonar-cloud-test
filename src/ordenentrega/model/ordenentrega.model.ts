import  { BaseModel } from "@proguidemc/http-module";
import { SuppliersTotal } from "../../carrito/model/cart.model";
import { Product } from "../../producto/model/producto.model";
import { OrdenEntregaEstado, OrdenEntregaEstadoEnum } from "./ordenentregaestado.model";
import { OrdenEntregaMotivo } from "../../shared/ordenentregamotivo/model/ordenentregamotivo.model";
import { OrdenEntregaProductoEstado, OrdenEntregaProductoEstadoEnum } from "./ordenentregaproductoestado.model";

export interface OrdenEntrega extends BaseModel {
    fechaplanificada: string;
    fechaentrega?: string;
    usuario: string;
    puntoventa: string;
    ordencompraid: string;
    estado: OrdenEntregaEstadoEnum;
    ordencompra: string;   
    destino: string;
    productos: OrdenEntregaItem[];
    origen: string;
}

export interface OrdenEntregaItem {
    productoid: string;
    cantidadpropuesta: number;
    cantidadrecibida?: number;
    preciounitario: number;
    motivoid?: string;
    observacion?: string;
    estado: OrdenEntregaProductoEstadoEnum;
}

export interface OrdenEntregaVM extends Omit<OrdenEntrega, "estado" | "productos"> {
    fechaactual: string;
    materialestotales : SuppliersTotal;
    estado?: OrdenEntregaEstado;
    productos: OrdenEntregaItemVM[];
}

export interface OrdenEntregaItemVM extends Omit<OrdenEntregaItem, "estado"> {
    producto?: Product;
    motivo?: OrdenEntregaMotivo;
    estado?: OrdenEntregaProductoEstado;
}
