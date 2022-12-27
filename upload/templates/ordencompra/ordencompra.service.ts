import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { DBName, BaseService } from '@proguidemc/http-module';
import { Proveedor } from '../../../src/shared/proveedor/model/proveedor.model';
import { Product } from '../../../src/producto/model/producto.model';
import { CotizacionService } from '../../../src/shared/procesos/cotizacion.service';
import { ProveedorService } from '../../../src/shared/proveedor/proveedor.service';
import { ProductService } from '../../../src/producto/producto.service';
import { CarritoOrdenesCompra, Cart, CartVM } from '../../../src/carrito/model/cart.model';
import { OrdenCompra, OrdenCompraItemVM, OrdenCompraVM } from './model/ordencompra.model';
import { OrdenCompraEstado, OrdenCompraEstadoEnum } from './model/ordencompraestado.model';
import { OrdenCompraEstadoService } from './ordencompraestado.service';
import { OrdenCompraOrdenesEntrega, OrdenEntregaVM } from '../../../src/ordenentrega/model/ordenentrega.model';
import { OrdenEntregaService } from '../../../src/ordenentrega/ordenentrega.service';
import { formatDate } from '../../../src/shared/utils/utils';
import { OrdenEntregaProductoEstadoEnum } from '../../../src/ordenentrega/model/ordenentregaproductoestado.model';
import { OrdenEntregaEstadoEnum } from '../../../src/ordenentrega/model/ordenentregaestado.model';
import { CarritoEstadoEnum } from '../../../src/carrito/model/carritoestado.model';
import { UserConfigService } from '../../../src/shared/userconfig/userconfig.service';
import { LugarTipoEnum } from '../../../src/shared/lugar/model/lugartipo.model';

@Injectable()
export class OrdenCompraService extends BaseService<OrdenCompra> {
    constructor(
        protected userConfigService: UserConfigService,
        public productService: ProductService,
        public proveedorService: ProveedorService,
        public ordenCompraEstadoService: OrdenCompraEstadoService,  
        private cotizacionService: CotizacionService,
        public ordenEntregaService: OrdenEntregaService,
        protected httpService: HttpService,      
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'ordencompra'}, httpService);
    }
    
    private async normalize(items: OrdenCompra[], includeOEs: boolean = false): Promise<OrdenCompraVM[]> {
        if (!Array.isArray(items) || items.length == 0) return [];

        const detalle: string[] = [];
        const detalleproveedores = items.map(i => i?.proveedorid).filter(i => i);

        if (detalleproveedores.length > 0) {
            for (const item of items) {
                if (!item?.id) continue;
                item.numberid = this.cotizacionService.padLeadingZeros(item.numberid, 8);
                item.puntoventa = this.cotizacionService.padLeadingZeros(item.puntoventa, 4);
                if (Array.isArray(item.productos)) {
                    for (const subitem of item.productos) {
                        if (detalle.indexOf(subitem.productoid) < 0) {
                            detalle.push(subitem.productoid);
                        }
                    }
                }
            }
        }
        
        if (detalle.length == 0) return [];

        const proveedores: Proveedor[] = [];
        const productos: Product[] = [];
        const estados: OrdenCompraEstado[] = [];

        const ordenesentrega: OrdenEntregaVM[] = [];
        if (includeOEs) {
            await Promise.all(items.map(i => this.ordenEntregaService.getAll(i.id || "")))
            .then(resp => {
                for (const item of resp) {
                    ordenesentrega.push(...item);    
                }
            })
            .catch(error => {
                console.error(error);
            });
        }

        await Promise.all([
            this.proveedorService.findAll({_id: {$in: detalleproveedores}}),
            this.productService.findAll({_id: {$in: detalle}}),
            this.ordenCompraEstadoService.findAll({})
        ])
        .then(responses => {
            proveedores.push(...responses[0]);
            productos.push(...responses[1]);
            estados.push(...responses[2]);
        })
        .catch(error => {
            console.error(error);
        });

        const getTotal = (oc: OrdenCompra): number => {
            let total = 0;
            if (Array.isArray(oc?.productos)) {
                for (const item of oc.productos) {
                    total = total + (item.preciounitario * item.cantidad);
                }
            }
            return total;
        }

        return items.map(item => {
            return {
                ...item,
                total: getTotal(item),
                ordenesentrega: ordenesentrega.filter(i => i.ordencompraid == item.id),
                proveedor: proveedores.find(i => i.id == item.proveedorid),
                estado: estados.find(i => i.id == item.estado),
                productos: item.productos.map(i => {
                    return {
                        ...i,
                        preciounitario: this.parseNumber(i.preciounitario),
                        diasproduccion: this.parseNumber(i.diasproduccion),
                        cantidad: this.parseNumber(i.cantidad),
                        producto: productos.find(j => j.id == i.productoid),
                    }
                })
            }
        });
    }

    async getFromCartId(carritoid: string): Promise<OrdenCompraVM[]> {
        return this.normalize(await this.findAll({carritoid}));        
    }

    async getFromIdWithOEs(id: string): Promise<OrdenCompraOrdenesEntrega> {
        return new Promise(async(resolve, reject) => {
            const ordencompra = await this.getFromId(id);
            if (!ordencompra) return reject({message: 'Error al obtener la orden de compra'});            
            return resolve({
                ordencompra,
                ordenesentrega: await this.ordenEntregaService.getAll(id),
            });
        });
    }

    async getFromIdWithAvailableCounts(id: string): Promise<OrdenCompraVM> {
        return new Promise(async(resolve, reject) => {
            let ordencompra: OrdenCompraVM | undefined;
            const ordenesentrega: OrdenEntregaVM[] = [];
            
            await Promise.all([
                this.getFromId(id),
                this.ordenEntregaService.getAll(id),
            ])
            .then(resp => {
                ordencompra = resp[0];
                ordenesentrega.push(...resp[1]);
            })
            .catch(error => {
                console.error(error);
            });
            
            if (!ordencompra) return reject({message: 'Error al obtener la orden de compra'}); 
            
            const productsOEs: {id: string, count: number}[] = [];
            for (const item of ordenesentrega) {
                if (!Array.isArray(item?.productos)) continue;
                for (const producto of item.productos) {
                    const index = productsOEs.findIndex(i => i.id == producto.productoid);
                    if (index < 0) {
                        productsOEs.push({
                            id: producto.productoid,
                            count: this.parseNumber(producto.cantidadpropuesta),
                        });
                    } else {
                        productsOEs[index].count = productsOEs[index].count + this.parseNumber(producto.cantidadpropuesta);
                    }
                }
            }

            if (Array.isArray(ordencompra.productos)) {
                for (const item of ordencompra.productos) {
                    const producto = productsOEs.find(i => i.id == item.productoid);
                    item.cantidaddisponible = item.cantidad;
                    if (producto) {
                        item.cantidaddisponible = item.cantidaddisponible - producto.count;                        
                    }
                }
            }

            // ordencompra.ordenesentrega = ordenesentrega;            
            return resolve(ordencompra);
        });
    }

    async getFromSupplierId(proveedorid: string): Promise<{supplier: Proveedor, items: OrdenCompraOrdenesEntrega[]}> {
        return new Promise(async(resolve, reject) => {
            const supplier = await this.proveedorService.findById(proveedorid);
            if (!supplier) return reject({message: 'No se encontro el proveedor'});

            const ordenes = await this.normalize(await this.findAll({proveedorid, estado: OrdenCompraEstadoEnum.Confirmada}), true); 
            if (!Array.isArray(ordenes) || ordenes.length == 0) return resolve({supplier, items: []});

            const ordenesEntrega: OrdenEntregaVM[] = await this.ordenEntregaService.getAll(ordenes.map(i => i.id || ""));
            const items = ordenes.map(item => {
                return {
                    ordencompra: item,
                    ordenesentrega: ordenesEntrega.filter(i => i.ordencompraid == item.id)
                }
            });

            resolve({
                items,
                supplier
            })
        });
    }

    async getFromId(id: string): Promise<OrdenCompraVM | undefined> {
        const orden = await this.findById(id);
        if (!orden) return undefined;
        const items = await this.normalize([orden]);
        if (!Array.isArray(items) || items.length == 0) return undefined;
        return items[0];                
    }

    async getAll(): Promise<CarritoOrdenesCompra[]> {
        const items: CarritoOrdenesCompra[] = [];
        const ordenes = await this.normalize(await this.findAll({}), true); 
        if (Array.isArray(ordenes) && ordenes.length > 0) {
            const carritos: CartVM[] = await this.findAllFlex({dbname: DBName.ShoppingManager, tablename: 'carrito'}, {estado: CarritoEstadoEnum.CompraEnCompra});
            const analizados: string[] = [];
            for (const iterator of ordenes) {
                const id = iterator.carritoid;
                if (!id || analizados.indexOf(id) >= 0) continue;
                analizados.push(id);
                
                const carrito = carritos.find(i => i.id == id);
                if (!carrito) continue;

                items.push({
                    carrito,
                    ordenescompra: ordenes.filter(i => i.carritoid == id),
                });
            }
        }
        return items;
    }

    async saveFromCart(carrito: Cart, usuario: string): Promise<OrdenCompra[]> {
        return new Promise(async (resolve, reject) => {
            if ([CarritoEstadoEnum.CompraEnEleccionGanadores, CarritoEstadoEnum.CompraEnCompra].indexOf(carrito?.estado) < 0) return reject({message: 'El estado del carrito es inválido'});

            const items = await this.findAll({carritoid: carrito.id});
            if (Array.isArray(items) && items.length > 0) return resolve(items); // Ya fueron creadas las OCs para el carrito
            
            if (Array.isArray(carrito.productos) && carrito.productos.length > 0) {
                const ordenes: OrdenCompra[] = [];
                const puntoventa = "1";

                for (const producto of carrito.productos) {
                    if (!producto?.proveedoridtm) continue;
                    const proveedor = producto.proveedores?.find(i => i.id == producto.proveedoridtm);
                    if (!proveedor) continue;
                    
                    let indexProveedor = ordenes.findIndex(i => i.proveedorid == proveedor.id);
                    if (indexProveedor < 0) {
                        indexProveedor = ordenes.length;
                        ordenes.push({
                            carritoid: carrito.id || "",
                            estado: OrdenCompraEstadoEnum.Solicitada,
                            fecha: this.cotizacionService.formatDate(),
                            puntoventa: puntoventa,
                            productos: [],
                            proveedorid: proveedor.id,
                            usuario,                                
                        });
                    }

                    ordenes[indexProveedor].productos.push({
                        cantidad: this.cotizacionService.sumCounts(producto.items || []),
                        diasproduccion: proveedor.diasproduccion || 0,
                        preciounitario: proveedor.preciounitario || 0,
                        productoid: producto.id,
                        
                    });
                }

                if (ordenes.length > 0) {
                    const orden = await this.createMany(ordenes);
                    if (orden) return resolve(orden);
                }
            }
            reject({message: 'No se encontraron proveedores para generar las ordenes de compra'});
        })
            
    }

    async generarOEs(ocid: string, count: number, deleteOEs: boolean = false) {
        return new Promise(async(resolve, reject) => {
            if (!deleteOEs && this.parseNumber(count) <= 0) return reject({message: 'Invalid request'});

            const ordenes = await this.ordenEntregaService.findAll({ordencompraid: ocid});
            if (Array.isArray(ordenes) && ordenes.length > 0) {
                if (!deleteOEs) {
                    return reject({message: 'La Orden de Compra ya tiene ordenes de entrega generadas'});
                }
                await this.ordenEntregaService.deleteMany({ordencompraid: ocid});             
            } else if (deleteOEs) {
                return reject({message: 'No se encontraron ordenes de entrega para la Orden de Compra'});
            } else {
                const ordencompra = await this.getFromId(ocid);
                if (!ordencompra) return reject({message: 'No se encontro la Orden de Compra'});
                
                const productsCount = ordencompra.productos?.length || 0;
                if (productsCount < count) count = productsCount;
                
                const iterationCount = Math.trunc(productsCount / count);
                const ordencompraid = ordencompra.id;
                const lugares = await this.productService.findAllFlex({dbname: DBName.ShoppingManager, tablename: 'lugar'}, {tipo: LugarTipoEnum.Deposito});
                let index = -1;

                while (count > 0) {
                    count--;
                    
                    let items: OrdenCompraItemVM[] = [];
                    if (count > 0) {
                        items = ordencompra.productos.splice(0, iterationCount);
                    } else {
                        items = ordencompra.productos;
                    }
                    
                    if (lugares.length > 0 && items.length > 0) {
                        delete ordencompra.id;
                        delete ordencompra._id;
                        delete ordencompra.createdAt;
                        delete ordencompra.updatedAt;
                        delete ordencompra["ordenesentrega"];

                        if (index >= lugares.length) {
                            index = -1;
                        }
                        index++;
                        
                        await this.ordenEntregaService.create({
                            ordencompra: ordencompra.puntoventa + '-' + ordencompra.numberid,
                            origen: ordencompra.proveedorid,
                            puntoventa: ordencompra.puntoventa,
                            usuario: ordencompra.usuario,
                            fechaplanificada: formatDate(undefined, count + 2),
                            destino: lugares[index].id,
                            ordencompraid: ordencompraid || "",
                            estado: OrdenEntregaEstadoEnum.Preparacion,
                            productos: items.map(item => {
                                return {
                                    estado: OrdenEntregaProductoEstadoEnum.EnPreparacion,
                                    cantidadpropuesta: item.cantidad,
                                    preciounitario: item.preciounitario,
                                    productoid: item.productoid,
                                }
                            })
                        });
                    }
                }
            }

            const orden = await this.findById(ocid);
            if (orden) {
                const ordenesn = await this.normalize([orden], true); 
                if (ordenesn && ordenesn.length > 0) return resolve(ordenesn[0]);
            }

            reject({message: 'No se encontro la orden de compra'});
        })
    }

}