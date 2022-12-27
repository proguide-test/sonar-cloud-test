import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { BaseFullService, DBName, JwtPayload, toArray } from '@proguidemc/http-module';
import { Usuario } from '../planillaarmado/model/plantilla.model';
import { PlanillaDespacho } from '../planilladespacho/model/planilladespacho.model';
import { PlanillaRecepcion } from '../planillarecepcion/model/planillarecepcion.model';
import { PlanillaRecepcionEstadoEnum } from '../planillarecepcion/model/planillarecepcionestado.model';
import { PlanillaRecepcionService } from '../planillarecepcion/planillarecepcion.service';
import { LugarVM } from '../shared/lugar/model/lugar.model';
import { OperadorLogico } from '../shared/operadorlogico/model/operadorlogico.model';
import { UserConfigService } from '../shared/userconfig/userconfig.service';
import { ArrayList, arraySorted, errorFn, formatDate, getFilterDate, toString } from '../shared/utils/utils';
import { Liquidacion, LiquidacionVM, PlanillaRecepcionALiquidar, ValoresLiquidacion } from './model/liquidacion.model';

@Injectable()
export class LiquidacionService extends BaseFullService<Liquidacion> {
    constructor(
        protected httpService: HttpService,
        protected userConfigService: UserConfigService,
        public planillaRecepcionService: PlanillaRecepcionService
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'liquidacion'}, httpService);
    }

    async get(_user: JwtPayload, from?: string, to?: string, id?: string, full?: boolean): Promise<LiquidacionVM | LiquidacionVM[]> {
        return new Promise(async(resolve, reject) => {
            try {
                const filter: any = {};

                if (id) {
                    filter["id"] = id;
                } else {
                    filter["createdAt"] = getFilterDate(from, to, true);
                }
                
                const liq: Liquidacion[] = [];
                await Promise.all([
                    this.findAll(filter),
                ])
                .then(responses => {
                    liq.push(...responses[0]);
                })
                .catch(errorFn);
                if (liq.length == 0) return resolve([]);
        
                const usuarioIds: string[] = [];
                const recepcionesid: string[] = [];
                liq.forEach(item => {
                    if (item.usuario && usuarioIds.indexOf(item.usuario) < 0) {
                        usuarioIds.push(item.usuario);
                    }
                    item.recepciones.forEach(r => {
                        if (recepcionesid.indexOf(r) < 0) {
                            recepcionesid.push(r);
                        }
                    })
                });
        
                if (usuarioIds.length == 0) return resolve([]);
        
                const usuarios: Usuario[] = [];
                const users = await this.userConfigService.findUsers({username: {$in: usuarioIds}});
                users.forEach((i: any) => {
                    const usuario: Usuario = {
                        id: i.id,
                        username: i.username,
                        email: i.email,
                        firstName: i.firstName,
                        lastName: i.lastName,
                    }
                    usuarios.push(usuario);
                });
        
                let planillasLiquidables: PlanillaRecepcionALiquidar[] = [];
                if (full) planillasLiquidables = await this.getElementosLiquidar({_id: {$in: recepcionesid}});
        
                const resp: LiquidacionVM[] = [];
                liq.forEach(item => {
                    const usuario = usuarios.find(i => i.username == item.usuario);
                    let recepciones: any[] = [];
                    if (full) recepciones = id ? planillasLiquidables : planillasLiquidables.filter(p => item.recepciones.indexOf(p.idplanilla) < 0);
                    resp.push(full ? 
                        {
                            ...item,
                            usuario,
                            recepciones
                        } :
                        {
                            ...item,
                            usuario,
                        }
                    );
                })
        
                return resolve(id ? resp[0] : arraySorted(resp, "createdAt"));
            } catch (error) {
                return reject({message: error});
            }
        });
    }

    async generate(user: JwtPayload, recepciones: string[], from: string, to: string): Promise<Liquidacion> {
        return new Promise(async(resolve, reject) => {
            try {
                if (!user?.username || !from || !to || !Array.isArray(recepciones) || recepciones.length == 0) return reject({message: 'Error! Revise los datos enviados'});
                
                const planillas = await this.planillaRecepcionService.findAll({_id: {$in: recepciones}, liquidacionid: {$in: [null, ""]}});
                if(!Array.isArray(planillas) || planillas.length == 0 || recepciones.length !== planillas.length) return reject({message: 'Las planillas indicadas no fueron encontradas'});
                let importe = 0;
                planillas.forEach((p: PlanillaRecepcion) => {
                    const palletsid = new ArrayList();
                    p.productos.forEach(prod => {
                        palletsid.push(prod.idpallet);                        
                    });
                    const totales = this.getValoresLiquidacion(palletsid.count());
                    importe += totales.total;
                });

                const liquidacion = await this.create({
                    fromperiodo: from,
                    toperiodo: to,
                    usuario: user.username,
                    importe,
                    recepciones: recepciones
                })
                if (!liquidacion) return reject({message: 'No se pudo insertar la liquidacion'});
                this.planillaRecepcionService.updateMany({liquidacionid: liquidacion._id}, {"_id" : {$in: recepciones}})
                return resolve(liquidacion);
            } catch (error) {
                return reject(error);
            }
        })
    }

    private async getElementosLiquidar(customfilter: any): Promise<PlanillaRecepcionALiquidar[]> {
        const result: PlanillaRecepcionALiquidar[] = [];
        const planillas: PlanillaRecepcion[] = await this.planillaRecepcionService.findAll(customfilter);
        if (toArray(planillas).length == 0) return result;

        const entitiesid = new ArrayList();
        const planillasdespachoid = new ArrayList();
        planillas.forEach(planilla => {
            entitiesid.push(planilla.origenid);
            entitiesid.push(planilla.destinoid);
            planillasdespachoid.push(planilla.planillaid);        
        });

        if (entitiesid.count() == 0 && planillasdespachoid.count() == 0) return result;
        const entities: LugarVM[] = [];
        const planillasdespacho: PlanillaDespacho[] = [];
        await Promise.all([
            this.userConfigService.getInfoEntities(entitiesid.get()),
            this.planillaRecepcionService.planillaDespachoService.findAll({_id: {$in: planillasdespachoid.get()}}),
        ])
        .then(responses => {
            entities.push(...responses[0]);
            planillasdespacho.push(...responses[1]);
        })
        .catch(errorFn);

        if (entities.length == 0 && planillasdespacho.length == 0) return result;
        const operadoresid: string[] = [];
        planillasdespacho.forEach(p => {
            if (operadoresid.indexOf(p.idoperador) < 0) {
                operadoresid.push(p.idoperador);
            }
        });
        const operadores: OperadorLogico[] = await this.planillaRecepcionService.planillaDespachoService.operadorLogicoService.findAll({id: {$in: operadoresid}});

        planillas.forEach((p: PlanillaRecepcion) => {

            const palletsid = new ArrayList();
            p.productos.forEach(prod => {
                palletsid.push(prod.idpallet);
            });

            const valores = this.getValoresLiquidacion(palletsid.count());
            const planilladespacho = planillasdespacho.find(pd => pd.id == p.planillaid);
            result.push({
                idplanilla: toString(p?._id),
                destino: entities.find(e => e.id == p.destinoid),
                origen: entities.find(e => e.id == p.origenid),
                operador: operadores.find(o => o.id == planilladespacho?.idoperador),
                planillarecepcionnro: toString(p.numberid),
                planilladespachonro: p.nroplanilladespacho,
                pos: planilladespacho?.pallets?.length || 0,
                valores,
            });
        });
        return (result);
    }

    private getValoresLiquidacion (cantidadpallets: number): ValoresLiquidacion {
        const valores: ValoresLiquidacion = {
            fijo: 1100,
            complementario: 100,
            total: 0
        };
        if (cantidadpallets <= 26) valores.total = ((cantidadpallets * valores.fijo) + valores.complementario);
        else {
            const excedente = cantidadpallets - 26;
            valores.total = ((cantidadpallets * valores.fijo) + valores.complementario) + ((excedente * valores.fijo) / 2);
        }
        return valores;
    }

    async getPlanillasLiquidables(from?: string, to?: string): Promise<PlanillaRecepcionALiquidar[]> {
        return new Promise(async(resolve, reject) => {
            try {
                if (!from) from = formatDate(undefined, -16, false, '-').substring(0, 10);
                if (!to) to = formatDate(undefined, 0, false, '-').substring(0, 10);
                
                if (from.length == 10) from += 'T00:00:00.000Z';
                if (to.length == 10) to += 'T23:59:59.999Z';

                const customFilter: any = {};
                customFilter["estado"] = {$in: [PlanillaRecepcionEstadoEnum.Entregaparcial, PlanillaRecepcionEstadoEnum.Entregatotal]};
                customFilter["liquidacionid"] = {$in: [null, ""]}; // Este filtro devuelve aquellos que no posean liquidacionid o posean con valor "";
                customFilter["createdAt"] = {
                    $gte: from,
                    $lte: to,
                };

                return resolve(await this.getElementosLiquidar(customFilter));
            } catch (error) {
                return reject(error);
            }
        })
    }
}
