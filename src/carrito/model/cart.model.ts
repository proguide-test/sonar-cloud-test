import  { BaseModel } from "@proguidemc/http-module";
import { Proveedor } from "../../shared/proveedor/model/proveedor.model";
import { DistribucionEstado } from "../../shared/estadodistribucion/model/estadodistribucion.model";
import { Product, ProductDTO } from "../../producto/model/producto.model";
import { CarritoEstadoEnum } from "./carritoestado.model";
import { toArray, toString } from "../../shared/utils/utils";

export interface Cart extends BaseModel {
    usuario?: string;
    estado: CarritoEstadoEnum;
    campania: string;
    plan: string;
    centrocosto: string;
    cuenta: string;
    estrategia: string;
    descripcion: string;
    productos: DistribucionInfo[];
    compartidocon: string;
    fechaesperadacompra: string;
    presupuesto: number;
}

export type CartAction = 'sendto-to' | 'sendto-shop';
export interface CartVM extends Cart {
    action?: CartAction;
    regional: boolean;
    enabledDelete: boolean;
    estadonombre: string;
}

export interface DistribucionInfoDTO extends Product {
    items: DistribucionItem[];    
}

export enum CartType {
    Cotizaciones = 'cotizaciones',
}

export enum DistribucionItemEstado {
    Pendiente = 'PD',
    Enviada = 'EN',
    Incompleta = 'IN',
}

export interface DistribucionInfo {
    id: string; 
    producto?: ProductDTO;
    arts?: ProductArt[];
    items?: DistribucionItem[];
    proveedores?: Supplier[];
    proveedoridcompras?: string;
    proveedoridtm?: string;
}

export interface ProductArt {
    name: string;
    archivo: string;
    modified?: any;
}

export interface DistribucionItem {
    id: string; // Id region o pais
    name: string; // Nombre de la region o pais
    cantidadpropuesta: number;
    cantidadsolicitada: number;
    estado: DistribucionEstado;
    finalizado?: boolean;
    tmusuario?: string;
    updatedAt?: string;
    destinos?: DistribucionDestino[],
}

export enum DistribucionTipo {
    PUNTO_VENTA = 'PDV',
    CENTRO_DISTRIBUCION = 'CD',
    DISTRIBUIDOR = 'D'
}

export interface DistribucionDestino {
    id: string;     // Id de PDV, CD o D
    name: string; // Nombre de PDV, CD o D 
    tipo: DistribucionTipo,
    cantidadpropuesta: number;
    cantidadsolicitada: number;
}

export interface RegionCount {
    regionId: string,
    count: number
}

export const carritoRequireProcess = (carrito?: Cart): boolean => {
    // Solo se genera proceso de distribucion, si la estrategia es Por Region
    if (!carrito || !carrito.estrategia || (
        (carrito.estrategia.toLowerCase() != 'region') && // por name
        (carrito.estrategia.toLowerCase() != '2')        // por id
    )) {
        return false;
    }

    if (!Array.isArray(carrito.productos) || carrito.productos.length == 0) return false;

    return true;
}

export const carritoDeleteEnabled = (carrito: Cart): boolean => {
    if (carrito.estado == CarritoEstadoEnum.PreparacionEnPreparacion){
        return true;
    }
    return false;
}

export const getRegionesCarrito = (carrito: Cart): string[] => {
    if (!carritoRequireProcess(carrito)) return [];
 
    const regiones: string[] = [];

    for (const item of carrito.productos) {
        if (Array.isArray(item.items)) {
            for (const region of item.items) {
                if (region.id && regiones.indexOf(region.id) < 0) {
                    regiones.push(region.id);
                }
            }
        }
    }

    return regiones;
}

export const getMaterialesRegion = (carrito: Cart, regionId: string, materiales: Product[]): DistribucionItem[] => {
    if (!carritoRequireProcess(carrito)) return [];
    // Esta funcion devuelve un array de DistribucionItem, pero de materiales para una region
    const resp: DistribucionItem[] = [];

    for (const item of carrito.productos) {
        if (Array.isArray(item.items)) {
            const index = item.items.findIndex(i => i.id == regionId);
            if (index >= 0) {
                resp.push({
                    id: item.id, // id producto
                    name: toString(materiales.find(p => p.id == item.id)?.nomenclatura),
                    cantidadpropuesta: item.items[index].cantidadpropuesta,
                    cantidadsolicitada: item.items[index].cantidadsolicitada,
                    estado: item.items[index].estado,
                })
            }
        }
    }

    return resp;
}

export const getResponsableTMRegion = (carrito: Cart, regionId: string, def: string = ""): string => {
    if (!carritoRequireProcess(carrito)) return def;

    const resp: any = {
        tmusuario: '',
        fecha: '',
    };

    for (const item of carrito.productos) {
        if (Array.isArray(item.items)) {
            const index = item.items.findIndex(i => i.id == regionId);
            if (index >= 0 && item.items[index].tmusuario && (resp.fecha == '' || resp.fecha < (toString(item.items[index].updatedAt)))) {
                resp.tmusuario = item.items[index].tmusuario;
                resp.fecha = item.items[index].updatedAt;
            }
        }
    }

    if (resp.tmusuario == '') {
        resp.tmusuario = toString(carrito.usuario);
    }
    
    return resp.tmusuario;
}

export const getDestinos = (carrito: Cart, productId: string, siteId: string): DistribucionDestino[] | [] => {
    if (Array.isArray(carrito.productos)) {
        const product = carrito.productos.find((i: DistribucionInfo) => i.id === productId);
        const site = product?.items?.find((i: DistribucionItem) => i.id === siteId);
        return toArray(site?.destinos);
    }
    return [];
}

export interface Quotation extends Omit<Cart, "productos"> {
    fechaactual: string;
    cotizaciones: QuotationCounter;
    totales?: QuotationTotal;
    productos?: QuotationProduct[];    
    proveedores?: QuotationSuppliers[];
    suppliers?: QuotationSuppliers[];
    estadonombre: string;
    proveedorestotales?: SuppliersTotal;
    acciones: {
        enviaracotizar?: boolean; //sendenabled
        finalizarcotizacion?: boolean; // finalizedenabled
        proponerproveedores?: boolean; // proposewinersenabled
        solicitargeneracionocs?: boolean;
    }
}

export interface SuppliersTotal {
    total: number; 
    parcial: number;
}


export interface QuotationCounter {
    enviadas: number,
    recibidas: number,
}

export interface QuotationSuppliers extends Proveedor {
    counters: QuotationSupplierCounter[];
}

export interface QuotationSupplierCounter {
    id: SupplierEstado;
    name: string,
    count: number,
    color: 'red' | 'blue' | 'green'
}

export interface QuotationTotal {
    total: number;
    cotizados: number;
}

export interface QuotationProduct {
    id: string;
    producto?: ProductDTO;
    cantidad: number; // Sumatoria de las cantidades (no se sabe si propuesta o asignada) de todas las regiones
    proveedores?: Supplier[];
    totales: QuotationTotal;
    proveedorcompras?: { id: string; name?: string; };
    proveedortm?: { id: string; name?: string; };
}

export interface Supplier {
    id: string;
    proveedor?: Proveedor;
    estado: SupplierEstado;
    preciounitario?: number;
    diasproduccion?: number;
    fechacotizacion?: Date;
}

export enum SupplierEstado {
    Pendiente = 'PD',
    Enviada = 'EN',
    Recibida = 'RE',
}
