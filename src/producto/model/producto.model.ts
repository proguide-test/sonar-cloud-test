import  { BaseModel } from "@proguidemc/http-module";

export interface Product extends BaseModel {
    nomenclatura?: string;
    tipoprecio?: string;
    marca?: string;
    tipomaterial?: string;
    categoria?: string;
    canal?: string;
    name?: string;
    descripcion?: string;
    idioma?: string;
    materialidad?: string;
    precio?: number;
    almacen?: string;
    centros?: string;
    sociedad?: string;
    pais?: string;
    lenguaje?: string;
    ubicacion?: string;
    dimension?: {
        alto: ProductDimension;
        ancho: ProductDimension;
        profundidad: ProductDimension;
        peso: ProductDimension;
        volumen: ProductDimension;
    };
    codigosap: string;
    codigotruck?: string;
    archivos?: string;
    imagenes?: string;
    stock?: string;
    estado?: ProductState;
    idcaso?: string;
    grupo?: string;
    negocio?: string;
}

export interface DistributionDTO {
    total: number, // cantidad del prodducto propuesta x TM
    status: string, // Total de regiones que intervienen en el carrito, contra total de regiones a las que ya se le acepto la cantidad solicitada
}

export interface ProductDistributionDTO extends Product {
    distribution: DistributionDTO;
}

export interface ProductDimension {
    valor: number;
    unidad: string;
}

export interface ProductDTO extends Product {
    status?: ProductStatus;
}

export type ProductStatus = 'full-edition' | 'read-only' |'only-codes' | 'only-price';
export enum ProductState {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO',    
}