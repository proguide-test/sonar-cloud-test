import  { BaseModel } from "@proguidemc/http-module";
import { OrdenEntregaVM } from "../../ordenentrega/model/ordenentrega.model";
import { Proveedor } from "../../shared/proveedor/model/proveedor.model";
import { Product } from "../../producto/model/producto.model";
import { OrdenCompraEstado, OrdenCompraEstadoEnum } from "./ordencompraestado.model";

export interface OrdenCompra extends BaseModel {
    fecha: string;
    proveedorid: string;
    usuario: string;
    estado?: OrdenCompraEstadoEnum;
    carritoid: string;
    productos: OrdenCompraItem[];
    puntoventa: string;
}

export interface OrdenCompraItem {
    productoid: string;
    cantidad: number;
    preciounitario: number;
    diasproduccion: number;
}

export interface OrdenCompraVM extends Omit<OrdenCompra, "estado" | "productos"> {
    total: number;
    proveedor?: Proveedor;
    estado?: OrdenCompraEstado;
    productos: OrdenCompraItemVM[];
    ordenesentrega?: OrdenEntregaVM[];
}

export interface OrdenCompraItemVM extends OrdenCompraItem {
    producto?: Product;
    cantidaddisponible?: number;    
}
