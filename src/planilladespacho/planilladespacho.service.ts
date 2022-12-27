import { HttpService } from '@nestjs/axios';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DBName, BaseFullService, JwtPayload, toArray } from '@proguidemc/http-module';
import { VehiculoService } from '../shared/vehiculo/vehiculo.service';
import { PalletVM } from '../pallet/model/pallet.model';
import { PalletService } from '../pallet/pallet.service';
import { NotificationType } from '../shared/userconfig/userconfig.service';
import { PlanillaDespacho, PlanillaDespachoCreate, PlanillaDespachoVM, RecepcionTotales, RecepcionVM } from './model/planilladespacho.model';
import { PlanillaDespachoEstado, PlanillaDespachoEstadoEnum } from './model/planilladespachoestado.model';
import { PlanillaDespachoEstadoService } from './planilladespachoestado.service';
import { PrinterDataItem } from '../shared/printer/printer.service';
import { applyFilterWitthPermission, ArrayList, ElementName, errorFn, formatDate, hasCustomPermission, padLeadingZeros, toString } from '../shared/utils/utils';
import { EstadoPalletEnum } from '../pallet/model/palletestado.model';
import { VehiculoVM } from '../shared/vehiculo/model/vehiculo.model';
import { PlanillaRecepcionService } from '../planillarecepcion/planillarecepcion.service';
import { ChoferService } from '../shared/chofer/chofer.service';
import { OperadorLogicoService } from '../shared/operadorlogico/operadorlogico.service';
import { ChoferVM } from '../shared/chofer/model/chofer.model';
import { OperadorLogico } from '../shared/operadorlogico/model/operadorlogico.model';
import { LugarVM } from '../shared/lugar/model/lugar.model';
import { PlanillaRecepcionEstado, PlanillaRecepcionEstadoEnum } from '../planillarecepcion/model/planillarecepcionestado.model';

@Injectable()
export class PlanillaDespachoService extends BaseFullService<PlanillaDespacho> {
    
    constructor(
        protected httpService: HttpService,
        public palletService: PalletService,
        public choferService: ChoferService,
        public operadorLogicoService: OperadorLogicoService,
        public vehiculoService: VehiculoService,
        public planillaEstadosService: PlanillaDespachoEstadoService,
        @Inject(forwardRef(() => PlanillaRecepcionService)) private planillaRecepcionService: PlanillaRecepcionService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'planilladespacho'}, httpService);
    }

    async getNormalizedInfo(user: JwtPayload, planillaIds: string[], misOrigenes: string[]): Promise<PlanillaDespachoVM[]> {
        const items = await this.findAll({_id: {$in: planillaIds}});
        return this.normalize(user, items, misOrigenes, true);
    }

    async print(user: JwtPayload, id: string, download: boolean): Promise<string> {
        return new Promise(async(resolve, reject) => {
            const username = user.username;            
            const planilla = await this.findById(id);
            const items = planilla ? await this.normalize(user, [planilla], []) : [];
            if (items.length === 0) {
                return reject({message: 'No se encontro la planilla'});
            }
            const item = items[0];
            const destinos: {destino: string}[] = item.destinos.map(d => {
                return {
                    destino: d?.name
                }
            });
            
            let productos: {
                numerooe: string, 
                pallet?: string,
                codigo: string,
                nombre?: string,
                producto: string,
                destinoitem?: string,
                cantidad: string,
            }[] = [];

            item.pallets.forEach(pallet => {
                pallet.productos
                // .filter(i => i.producto)
                .forEach(producto => {                        
                    productos.push({
                        pallet: pallet.numberid,
                        numerooe: padLeadingZeros(producto.ordentransporte?.puntoventa, 4) + '-' + padLeadingZeros(producto.ordentransporte?.numberid, 8),
                        codigo: padLeadingZeros(producto.producto?.codigotruck, 6),
                        producto: padLeadingZeros(producto.producto?.codigotruck, 6) + ' - ' + producto.producto?.name,
                        nombre: producto.producto?.name,
                        cantidad: this.parseNumber(producto.cantidad).toString(),
                        destinoitem: pallet.destino?.name,
                    });
                });
            });

            productos = await this.planillaRecepcionService.printerService.completeArray('planilla_despacho', productos, 
                {
                    pallet: '',
                    numerooe: '',
                    codigo: '',
                    nombre: '',
                    producto: '',
                    cantidad: '',
                    destinoitem: '',
                }
            );

            const data: PrinterDataItem[] = [
                {
                    name: 'numero',
                    value: padLeadingZeros(item.numberid, 6)
                },{
                    name: 'origen',
                    value: item.origen?.name,
                },{
                    name: 'productos',
                    value: JSON.stringify(productos),
                    isTable: true,
                },{
                    name: 'destinos',
                    value: JSON.stringify(destinos),
                    isTable: true,
                },
                
                {
                    name: 'patente',
                    value: item.vehiculo?.patente,
                },{
                    name: 'fecha',
                    value: formatDate(new Date(toString(item.createdAt)), 0, false, "/"), 
                },{
                    name: 'operador',
                    value: item.operador?.nombre,
                },{
                    name: 'posiciones',
                    value: item.vehiculo?.posiciones?.toString(),
                },{
                    name: 'chofer',
                    value: item.chofer?.nombrecompleto,
                },{
                    name: 'tipo',
                    value: item.vehiculo?.tipovehiculo?.toUpperCase(),
                },
            ];   
            
            const fileName = await this.planillaRecepcionService.printerService.generate(username, "planilla_despacho", data, download);
            if (!fileName) return reject({message: 'No se pudo generar el pdf'}); 
            resolve(fileName);

        });
            
    }

    private evaluateBody(body: PlanillaDespachoCreate) {
        if (this.parseNumber(body.idchofer) == 0) {
            return {
                ...body,
                message: 'Debe ingresar un chofer'
            }
        }
        if (this.parseNumber(body.idoperador) == 0) {
            return {
                ...body,
                message: 'Debe ingresar un operador'
            }
        }
        if (this.parseNumber(body.idvehiculo) == 0) {
            return {
                ...body,
                message: 'Debe ingresar un vehiculo'
            }
        }
        if (body.pallets.length == 0) {
            return {
                ...body,
                message: 'Debe seleccionar al menos un pallet.',
            }
        }

        if (!body.recepciones) body.recepciones = [];
        if (!body.pallets) body.pallets = [];
        
        return body;
    }

    insert(user: any, fbody: PlanillaDespachoCreate): Promise<PlanillaDespacho | undefined> {
        return new Promise(async(resolve, reject) => {
            const body = this.evaluateBody(fbody);
            if (body.message) {
                return reject({message: body.message});
            }
            
            const pallets = await this.palletService.findAll({_id: {$in: body.pallets}});
            if (pallets.length == 0) return reject({message: 'Error al obtener pallets.'});
            if (!pallets.every(p => p.origenid == pallets.find(pa => pa)?.origenid)) return reject({message: 'Todas los pallets deben tener el mismo origen.'});

            const userInfo = await this.palletService.userConfigService.get(user.userId);
            if (userInfo.origenesid.length === 0) return reject({message: 'El usuario no posee origen.'});
            
            const newItem = await this.create({
                ...body,
                usuario: user?.username,
                estado: PlanillaDespachoEstadoEnum.Generada,
                origenid: userInfo.origenesid[0],
            });

            if (newItem) {
                await Promise.all(
                    body.pallets.map(i => this.palletService.update(i, {estado: EstadoPalletEnum.Asignado, nroplanilladespacho: newItem.numberid}))
                )
                .catch(errorFn)
            }
            
            resolve(newItem);
        })
    }

    private permissionOk(user: JwtPayload, elementName: ElementName): boolean {
        return hasCustomPermission(user, 'planillas de despacho', elementName);
    }

    get(user: JwtPayload, id: string, filter?: any): Promise<PlanillaDespachoVM | PlanillaDespachoVM[]> {
        return new Promise(async (resolve, rejects) => {
            try {
                const userInfo = await this.palletService.userConfigService.get(user.userId);
                if (toArray(userInfo.origenesid).length === 0) return rejects({message: 'El usuario no posee origen.'});
            
                if (!filter) filter = {};

                const sources = userInfo.origenesid;
                const includeAll = this.permissionOk(user, 'include-all');
                const includeTargets = this.permissionOk(user, 'include-target');
                applyFilterWitthPermission(filter, includeAll, includeTargets, userInfo.origenesid);
                
                if (id) {
                    filter['_id'] = id;
                }

                const planillasVM = await this.normalize(user, await this.findAll(filter), sources);
                if (toArray(planillasVM).length == 0) {
                    if (id) return rejects({message: 'No se encontro la planilla'});
                    return resolve([]);
                }

                resolve(id ? planillasVM[0] : planillasVM);
            }
            catch (error) {
                return rejects(error);
            }
        })
    }

    despachar(user: JwtPayload, idplanilla: string, idpallets: string[], mode: 'dispatch' | 'save'): Promise<void> {
        return new Promise( async (resolve, rejects) => {
            try {
                if(!user?.userId || !user?.username || !Array.isArray(idpallets) || !mode) return rejects({message: 'Verifique los parametros ingresados.'});
                
                const planilla = await this.findById(idplanilla);
                if(!planilla) return rejects({message: 'Error al obtener datos de la planilla.'});
                if(planilla.estado != PlanillaDespachoEstadoEnum.Generada) return rejects({message: 'No puede realizar modificaciones a una planilla en uso.'});
                
                if(!Array.isArray(planilla?.pallets)) planilla.pallets = [];
                
                // Si el pallet no esta incluida en la planilla, es nueva.
                const idPalletsNuevos = idpallets.filter((item) => !planilla.pallets.includes(item));
                // Si el pallet estaba incluido y ya no, se eliminó.
                const idPalletsEliminados = planilla.pallets.filter((item) => !idpallets.includes(item));
                // Segun el modo, los palets nuevos seran Asignados o Despachados.
                const estadoPallet = mode == 'dispatch' ? EstadoPalletEnum.Despachado : EstadoPalletEnum.Asignado;

                if (idPalletsNuevos.length > 0) {
                    // obtenemos los pallets nuevos a agregar.
                    const palletsNuevos = await this.palletService.findAll({_id: {$in: idPalletsNuevos}});
                    if(toArray(palletsNuevos).length == 0) return rejects({message: 'Error al obtener pallets a agregar.'});
                    
                    // Si alguno de los pallets no esta liberado o generado, no podemos permitir la inclusion.
                    if (palletsNuevos.some((item) => item.estado != EstadoPalletEnum.Generado && item.estado != EstadoPalletEnum.Liberado)) {
                        return rejects({message: 'No pueden incluirse pallets en uso.'});
                    }
                    
                    if (mode != 'dispatch') {
                        // Solo se actualiza si no se esta despachando, ya que en despacho, se actualiza el estaado todo junto al fin de la funcion
                        this.palletService.updateMany({
                            estado: estadoPallet, 
                            nroplanilladespacho: planilla.numberid,
                            nroplanillarecepcion: ''
                        }, {
                            _id: {$in: palletsNuevos.map(i => i._id)}
                        });     
                    }

                    for (let i = 0; i < palletsNuevos.length; i++) {
                        planilla.pallets.push(toString(palletsNuevos[i]._id));
                    }
                }

                // Quitamos los pallets a eliminar.
                if (idPalletsEliminados.length > 0) {
                    planilla.pallets = planilla.pallets.filter((item) => !idPalletsEliminados.includes(item));
                    this.palletService.updateMany({
                        estado: EstadoPalletEnum.Liberado, 
                        nroplanilladespacho: '',
                        nroplanillarecepcion: ''
                    }, {
                        _id: {$in: idPalletsEliminados}
                    });                    
                }
                
                if (mode == 'dispatch') {
                    await Promise.all([
                        this.palletService.updateMany({
                            estado: EstadoPalletEnum.Despachado, 
                            nroplanilladespacho: planilla.numberid
                        }, {
                            _id: {$in: planilla.pallets},
                            estado: {$in: [EstadoPalletEnum.Asignado, EstadoPalletEnum.Liberado]}
                        }),
                        this.update(idplanilla, {
                            pallets: planilla.pallets, 
                            estado: PlanillaDespachoEstadoEnum.Despachada,
                            fechadespacho: formatDate()
                        })
                    ])
                    .then(_resp => {
                        this.planillaRecepcionService.generate(user, {
                            ...planilla,
                            estado: PlanillaDespachoEstadoEnum.Despachada
                        })
                        .then(async recepciones => {
                            await this.update(idplanilla, {recepciones});
                            await this.planillaRecepcionService.sendNotification(NotificationType.LG_GENERACION_PR, user, recepciones);
                            resolve();
                        })
                        .catch(error => {
                            rejects(error);
                        });
                    })
                    .catch(_error => {
                        rejects({message: 'No se pudo despachar la planilla'});
                    })
                } else if (await this.update(idplanilla, {pallets: planilla.pallets})) {
                    resolve()
                } else {
                    rejects({message: 'No se pudo despachar la planilla'});
                }
            } catch (error) {
                return rejects({message: error  || 'Error al guardar.'});
            }
        });
    }

    private getRecepciones = (planillasRecepcionIds: string[], full=false): Promise<RecepcionVM[]> => {
        return new Promise(async resolve => {
            // de todos los productos de las recepcion, sacar los id de pallet, 
            if (!Array.isArray(planillasRecepcionIds)) return resolve([]);
            const recepciones = await this.planillaRecepcionService.findAll({_id: {$in: planillasRecepcionIds}});

            const entitiesids: string[] = [];
            if (full) {
                recepciones.forEach(item => {
                    if (item.origenid && !entitiesids.some(i => i == item.origenid)) {
                        entitiesids.push(item.origenid);
                    }
                    if (item.destinoid && !entitiesids.some(i => i == item.destinoid)) {
                        entitiesids.push(item.destinoid);
                    }
                })
            }

            const entitiesPR: LugarVM[] = [];
            const estadosPR: PlanillaRecepcionEstado[] = await this.planillaRecepcionService.planillaRecepcionEstadoService.findAll({});
            
            if (full) {
                await this.palletService.userConfigService.getInfoEntities(entitiesids)
                .then(response => {
                    entitiesPR.push(...response)
                })
                .catch(errorFn);
            }

            const recepcionesVM: RecepcionVM[] = [];
            recepciones.forEach(item => {
                const destino = entitiesPR.find(i => i.id == item.destinoid);
                const origen = entitiesPR.find(i => i.id == item.origenid);
                const estado =  estadosPR.find(i => i.id == item.estado);
                if (full) {
                    recepcionesVM.push({
                        ...item,
                        destino,
                        origen,
                        estado,
                    })
                } else {
                    recepcionesVM.push({
                        ...item,
                        estado,
                    })
                }
            })
            resolve(recepcionesVM);
        })
    }
    
    private getPallets = (user: JwtPayload, misOrigenes: string[], palletIds: string[], excludePalletsInfo?: boolean): Promise<PalletVM[]> => {
        return new Promise(async resolve => {
            if (misOrigenes.length == 0 && excludePalletsInfo) {
                return resolve([]);
            }                
            resolve(await this.palletService.getAll(user, await this.palletService.findAll({_id: {$in: palletIds}}), misOrigenes));
        })
    }

    private async normalize(user: JwtPayload, planillas: PlanillaDespacho[], misOrigenes: string[], excludePalletsInfo?: boolean): Promise<PlanillaDespachoVM[]> {        
        planillas = planillas.filter(i => i);
        const fullRecepciones = planillas.length == 1;
        const origenes = await this.palletService.userConfigService.allSources(planillas.map(i => i.origenid));    
        if (origenes.length == 0) return [];
        
        let chofersVM: ChoferVM[] = [];
        let operadoresVM: OperadorLogico[] = [];
        let vehiculosVM: VehiculoVM[] = [];
        let palletsVM: PalletVM[] = [];
        let recepcionVM: RecepcionVM[] = [];
        let estadosVM: PlanillaDespachoEstado[] = [];
        let usuarios: any[] = [];
        
        const recepcionIds: string[] = [];
        const palletIds: string[] = [];
        
        const usuarioIds = new ArrayList();
        const operadorIds = new ArrayList();
        const choferIds = new ArrayList();
        const vehiculoIds = new ArrayList();

        planillas.forEach(i => {
            palletIds.push(...i.pallets);
            recepcionIds.push(...toArray(i.recepciones));
            usuarioIds.push(i.usuario);
            operadorIds.push(i.idoperador);
            choferIds.push(i.idchofer);
            vehiculoIds.push(i.idvehiculo);
        });
        
        await Promise.all([
            this.choferService.findAll({id: {$in: choferIds.get()}}),
            this.operadorLogicoService.findAll({id: {$in: operadorIds.get()}}),
            this.vehiculoService.findAll({id: {$in: vehiculoIds.get()}}),
            this.planillaEstadosService.findAll({}),
            this.getPallets(user, misOrigenes, palletIds, excludePalletsInfo),            
            this.palletService.userConfigService.findUsers({username: {$in: usuarioIds.get()}}),
            this.getRecepciones(recepcionIds, fullRecepciones),
        ])
        .then(responses => {
            chofersVM = this.choferService.normalize(responses[0]);
            operadoresVM = responses[1];
            vehiculosVM = this.vehiculoService.normalize(responses[2]);
            estadosVM = responses[3];
            palletsVM = responses[4];
            usuarios = responses[5];
            recepcionVM = responses[6];
        })
        .catch(errorFn)

        palletsVM.forEach(item => {
            const recepcion = !item.nroplanillarecepcion ? null : recepcionVM.find(i => i.numberid == item.nroplanillarecepcion);
            if (Array.isArray(recepcion?.productos)) {
                item.productos.forEach(producto => {
                    const recepcionItem = recepcion?.productos.find(i => i.idpallet == item.id && i.ordentransporteid == producto.ordentransporteid && i.idproducto == producto.productoid);
                    if (recepcionItem) {
                        producto.cantidadrecibida = recepcionItem.cantidadrecibida;
                        producto.motivo = recepcionItem.motivo;
                    }
                });
            }
        });        

        return this.getPlanillas(planillas, {chofersVM, operadoresVM, vehiculosVM, palletsVM, recepcionVM, estadosVM, usuarios, origenes, misOrigenes}, fullRecepciones);
    }

    private getPlanillas(planillas: PlanillaDespacho[],
        arrays: {
            chofersVM: ChoferVM[],
            operadoresVM: OperadorLogico[],
            vehiculosVM: VehiculoVM[],
            palletsVM: PalletVM[],
            recepcionVM: RecepcionVM[],
            estadosVM: PlanillaDespachoEstado[],
            usuarios: any[],
            origenes: LugarVM[],
            misOrigenes: string[],
        },
        fullRecepciones?: boolean
    ) {
        const planillasNormalizadas: PlanillaDespachoVM[] = [];
       
        planillas.forEach(planilla => {
            const usuario = arrays.usuarios.find(u => u.username == planilla.usuario);
            const chofer = arrays.chofersVM.find((item) => item.id == planilla.idchofer);
            const operador = arrays.operadoresVM.find((item) => item.id == planilla.idoperador);
            const vehiculo = arrays.vehiculosVM.find((item) => item.id == planilla.idvehiculo);
            const estado = arrays.estadosVM.find((item) => item.id == planilla.estado);
            const pallets: PalletVM[] = [];
            const destinos: LugarVM[] = [];
            planilla.pallets.forEach(id => {
                const palletVM = arrays.palletsVM.find((item) => item.id == id);
                if (palletVM) pallets.push(palletVM);
            });

            pallets.forEach(j => {
                const destino = j.destino;
                if (destino && !destinos.some(d => d._id == destino._id)) {
                    destinos.push(destino);
                }
            })

            /*
             Se deben agregar las planilla que: 
                1. No tengan pallets en la DB
                2. Al menos un pallet se haya normalizado correctamente, ya que la normalizacion de pallets 
                    elimina los pallets cuyas OEs no correspondan a los origenes del usuario.
            */

            if (arrays.misOrigenes.length == 0 || planilla.pallets.length == 0 || pallets.length > 0) {
                let recepciontotales: RecepcionTotales | undefined;
                const recepciones = arrays.recepcionVM.filter(p => p.nroplanilladespacho == planilla.numberid);
                if (recepciones.length > 0) {
                    recepciontotales = {
                        total: recepciones.length,
                        confirmadas: recepciones.filter(p => p.estado?.id != PlanillaRecepcionEstadoEnum.EnTransito).length,
                    }
                }

                planillasNormalizadas.push({
                    ...planilla,
                    usuario,
                    origen: arrays.origenes.find(o => o.id == planilla.origenid),
                    chofer,
                    operador,
                    pallets,
                    vehiculo,
                    estado,
                    destinos,
                    recepciones: fullRecepciones ? arrays.recepcionVM : toArray(planilla.recepciones),
                    recepciontotales,
                    viewenabled: arrays.misOrigenes.length == 0 || arrays.misOrigenes.indexOf(planilla.origenid) >= 0
                });
            }
        });
        return planillasNormalizadas;
    }

    anular(idplanilla: string): Promise<PlanillaDespacho | undefined> {
        return new Promise (async (resolve, rejects) => {
            const planilla = await this.findById(idplanilla);
            if (planilla?.estado != PlanillaDespachoEstadoEnum.Generada) return rejects({message: "No se puede anular una planilla despachada"});
            if (!Array.isArray(planilla.pallets) || planilla.pallets.length == 0) rejects({message: 'Error al obtener los pallets de la planilla.'});
            const updatePalletsRes = await this.palletService.updateMany({ estado: EstadoPalletEnum.Liberado, nroplanilladespacho: '' }, {_id: { $in: planilla.pallets }});
            if (!updatePalletsRes) return rejects({message: 'Error al actualizar los pallets de la planilla.'})
            return resolve(await this.update(toString(planilla.id), {estado: PlanillaDespachoEstadoEnum.Anulada}));
        })
    }

    agregarPallets(idPlanilla: string, idPallets?: string[]) {
        return new Promise(async (resolve, rejects) => {
            try {
                if(!Array.isArray(idPallets) || idPallets.length == 0) return rejects({message: 'Su peticion no incluye pallets.'});

                const planilla = await this.findById(idPlanilla);
                if(planilla?.estado != PlanillaDespachoEstadoEnum.Generada) return rejects({message: 'El estado de esta planilla no admite modificaciones.'});

                let pallets = await this.palletService.findAll({_id: {"$in": idPallets}});
                if(!Array.isArray(pallets) || pallets.length === 0) return rejects({message: 'Error al obtener los pallets solicitados.'});
                if(pallets.some((pallet) => pallet.estado != EstadoPalletEnum.Generado && pallet.estado != EstadoPalletEnum.Liberado)) return rejects({message: 'No pueden agregarse pallets que se encuentran despachados.'});
                pallets = pallets.filter((item) => !planilla.pallets.includes(toString(item._id)));
                if(pallets.length == 0) return rejects({message: 'Los pallets solicitados ya pertenecian a la planilla.'});
                
                pallets.forEach(pallet => {
                    const itemId = toString(pallet._id);
                    this.palletService.update(itemId, {estado: EstadoPalletEnum.Asignado, nroplanilladespacho: planilla.numberid});
                    planilla.pallets.push(itemId);
                });

                return resolve(await this.update(toString(planilla._id), {pallets: planilla.pallets}));
            } catch (error) {
                return rejects({message: error || 'Error al agregar pallets.'});
            }
        })
    }
}