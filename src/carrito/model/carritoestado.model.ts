import  { BaseModel } from "@proguidemc/http-module";

export class CarritoEstado extends BaseModel {
    name!: string;
    enabled!: boolean;
    fase!: string;
    icon!: string;
    event!: string;
}

export enum CarritoEstadoEnum {
    PreparacionEnPreparacion = "preparacion",
    PreparacionEnPlanificacion = "planificacion",
    CompraEnCotizacion = "cotizacion",
    CompraPropuestaProveedor = "propuesta",
    CompraEnEleccionGanadores = "eleccion",
    CompraEnCompra = "compra",
    ProduccionPreparacion = "pdpreparacion",
    ProduccionControl = "pdcontrol",
    ProduccionTerminado = "pdterminado",
    ProduccionRechazado = "pdrechazado",
    RecepcionEnCamino = "rcencamino",
    RecepcionRecibido = "rcrecibido",
    RecepcionRechazado = "rcrechazado",
    TrasladoEnDespacho = "trendespacho",
    TrasladoDespachado = "trdespachado",
    TrasladoRecibido = "trrecibido",
    Cerrado = "cerrado",
}
