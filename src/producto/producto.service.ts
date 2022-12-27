import { HttpService } from '@nestjs/axios';    
import { Injectable } from '@nestjs/common';
import { Product, ProductDTO, ProductState, ProductStatus } from './model/producto.model';
import { BaseFullService, configurationGet, DBName, HttpResponse, JwtPayload, parseNumber, testIsRunning } from '@proguidemc/http-module';
import { MarcaService } from '../shared/marca/marca.service';
import * as excel from 'exceljs';
import { SociedadService } from '../shared/sociedad/sociedad.service';
import { Configuration } from '../shared/configuration/configuration.enum';
import { MaterialesOutput, MaterialesService } from '../shared/legacy/services/materiales.service';
import { Marca } from '../shared/marca/model/marca.model';
import { GrupoService } from '../shared/grupo/grupo.service';
import { Grupo } from '../shared/grupo/model/grupo.model';
import { TipoM } from '../shared/tipomaterial/model/tipom.model';
import { StockConsultaInput, StockConsultaOutput, StockConsultaService } from '../shared/legacy/services/stockconsulta.service';
import { addDefaultRows, ArrayList, convertImages, errorFn, formatDate, getExcelRow, padLeadingZeros, toString } from '../shared/utils/utils';
import { UserConfigService } from '../shared/userconfig/userconfig.service';

@Injectable()
export class ProductService extends BaseFullService<Product> {

    constructor(        
        public userConfigService: UserConfigService,
        public marcaService: MarcaService,
        public sociedadService: SociedadService,        
        protected httpService: HttpService,
        protected materialesService: MaterialesService,
        protected grupoService: GrupoService,
        protected stockConsultaService: StockConsultaService,
    ) {
        super({dbname: DBName.ShoppingManager, tablename: 'producto'}, httpService);
    }

    async findAllTest() {
        return this.findAll({numberid: {$lt: '100000'}});
    }
    
    async getStockConsulta(user: JwtPayload, items: StockConsultaInput[], timeout?: number):  Promise<StockConsultaOutput[]> {
        return new Promise(resolve => {
            const SAP_CONSULTA_ENABLED = this.parseNumber(configurationGet(Configuration.SAP_CONSULTA_ENABLED)) == 1 || testIsRunning();
            if (!SAP_CONSULTA_ENABLED) {
                return resolve(items.map(input => {
                    return {
                        available: -1,
                        compromised: -1,
                        code: "",
                        input,
                    }
                }));
            }

            Promise.all(
                items.map(i => this.stockConsultaService.post(user, i, timeout))
            ).then(response => {
                resolve(response);
            })
            .catch(_error => resolve([]));
        });
    }

    synchronize(timeout: number = 10000, materialesSAP?: MaterialesOutput[] | void) {
        setTimeout(async () => {
            // si "TIMEOUT" es cero se ejecuta una vez
            // si es menor que cero no se ejecuta nunca (POR DEFECTO)
            // Si es mayor que cero, se ejecuta cada "TIMEOUT" mseg.
            const TIMEOUT = this.parseNumber(configurationGet(Configuration.MATERIALES_TIMEOUT)) * 60 * 1000; // transformar minutos a mseg.                        
            if (TIMEOUT < 0 && !materialesSAP) return;

            this.debugLog("synchronize.BEGIN");
            if (!materialesSAP) {
                materialesSAP = await this.materialesService.post({userId: '', roles: [], username: ''}, {}).catch(errorFn);                
            }

            if (Array.isArray(materialesSAP) && materialesSAP.length > 0) {
                this.debugLog("synchronize.Materiales", {length: materialesSAP.length});
                const productos: Product[] = [];
                const marcas: Marca[] = [];
                const grupos: Grupo[] = [];
                const tipomaterial: TipoM[] = [];
                let error = null;
                
                const marcaIds = new ArrayList();
                const grupoIds = new ArrayList();
                const tipomaterialIds = new ArrayList();
                materialesSAP.forEach(i => {
                    marcaIds.push(i.marca);
                    grupoIds.push(i.grupo);
                    tipomaterialIds.push(i.tipomaterial);            
                })
                
                // Se obtiene toda la info actual de mongo, en base a lo que viene de SAP
                await Promise.all([
                    this.findAll({}), //Analizar si conviene poner un where tan grande: codigosap: {$in: materialesSAP.map(i => i.codigosap)}
                    this.sociedadService.tipoMService.findAll({id: {$in: tipomaterialIds.get()}}),
                    this.marcaService.findAll({id: {$in: marcaIds.get()}}),
                    this.grupoService.findAll({id: {$in: grupoIds.get()}}),
                ])
                .then(responses => {
                    productos.push(...responses[0]);
                    tipomaterial.push(...responses[1]);
                    marcas.push(...responses[2]);
                    grupos.push(...responses[3]);
                })
                .catch(e => {
                    error = e;
                });
                
                this.debugLog("synchronize.InfoMongo", {
                    productos: productos.length, 
                    marcas: marcas.length, 
                    grupos: grupos.length, 
                    tiposmaterial: tipomaterial.length
                });

                // Si hubo error en Mongo, se loguea
                if (error) {
                    let logText = '';
                    try {
                        logText = JSON.stringify(error);
                    } catch (err) {
                        logText = 'Unknown Error';
                    }
                    this.errorLog("synchronize.ErrorMongo.GET", {error: logText, length: materialesSAP.length});
                } else {
                    const inserciones: Product[] = [];
                    const marcasInserciones: Marca[] = [];
                    const gruposInserciones: Grupo[] = [];
                    const tiposmaterialInserciones: TipoM[] = [];

                    const promesasProductos: Promise<Product[]>[] = [];
                    const promesasMarcas: Promise<Marca[]>[] = [];
                    const promesasGrupos: Promise<Grupo[]>[] = [];
                    const promesasTiposMaterial: Promise<TipoM[]>[] = [];

                    for (const item of materialesSAP) {
                        
                        if (!item?.codigosap || !item?.name) continue;

                        // MARCAS
                        if (item?.marca) {
                            const marca = marcas.find(i => i.id == item.marca);
                            const marcaName = item.marcanombre || item.marca;
                            const newMarca: Marca = {
                                enabled: true,
                                name: marcaName,                            
                            };
                            if (!marca) {
                                if (!marcasInserciones.some(i => i.id == item.marca)) {
                                    newMarca.id = item.marca;
                                    marcasInserciones.push(newMarca);
                                }
                            } else if (marca.name != marcaName && item.marcanombre) {
                                marca.name = marcaName;
                                promesasMarcas.push(this.marcaService.updateMany(newMarca, {id: item.marca}));
                            }
                        }

                        // TIPO MATERIAL
                        if (item?.tipomaterial) {
                            const tipoma = tipomaterial.find(i => i.id == item.tipomaterial);
                            const newItem: TipoM = {
                                enabled: true,
                                name: item.tipomaterial
                            };
                            if (!tipoma) {
                                if (!tiposmaterialInserciones.some(i => i.id == item.tipomaterial)) {
                                    newItem.id = item.tipomaterial;
                                    tiposmaterialInserciones.push(newItem);
                                }
                            } else if (tipoma.name != item.tipomaterial) {
                                tipoma.name = item.tipomaterial;
                                promesasTiposMaterial.push(this.sociedadService.tipoMService.updateMany(tipoma, {id: item.tipomaterial}));
                            }
                        }

                        // GRUPOS
                        if (item?.grupo) {
                            const grupo = grupos.find(i => i.id == item.grupo);
                            const grupoName = item.gruponombre || item.grupo;
                            const newGrupo: Grupo = {
                                enabled: true,
                                name: grupoName,                            
                            };
                            if (!grupo) {
                                if (!gruposInserciones.some(i => i.id == item.grupo)) {
                                    newGrupo.id = item.grupo;
                                    gruposInserciones.push(newGrupo);
                                }
                            } else if (grupo.name != grupoName && item.gruponombre) {
                                grupo.name = grupoName;
                                promesasGrupos.push(this.grupoService.updateMany(newGrupo, {_id: grupo._id}));
                            }
                        }

                        // PRODUCTOS
                        const currentProduct = productos.find(i => i.codigosap == item.codigosap);
                        
                        const newProduct: Product = {
                            marca: item.marca,
                            tipomaterial: item.tipomaterial,
                            name: item.name,
                            centros: item.centros,
                            codigotruck: item.codigotruck,
                            estado: ProductState.ACTIVO,
                            grupo: item.grupo,
                            negocio: item.negocio,
                            codigosap: item.codigosap
                        };

                        if (!currentProduct) {
                            newProduct.codigosap = item.codigosap;
                            inserciones.push(newProduct);
                        } else if (currentProduct.marca != newProduct.marca || currentProduct.tipomaterial != newProduct.tipomaterial || 
                            currentProduct.name != newProduct.name || currentProduct.centros != newProduct.centros || 
                            currentProduct.codigotruck != newProduct.codigotruck || currentProduct.negocio != newProduct.negocio || 
                            currentProduct.grupo != newProduct.grupo
                        ) {
                            promesasProductos.push(this.updateMany(newProduct, {codigosap: newProduct.codigosap}));
                        }
                    }

                    this.debugLog("synchronize.Update.Begin", {
                        productos: {
                            nuevos: inserciones.length,
                            editados: promesasProductos.length,
                        }, 
                        marcas: {
                            nuevos: marcasInserciones.length,
                            editados: promesasMarcas.length,
                        }, 
                        grupos: {
                            nuevos: gruposInserciones.length,
                            editados: promesasGrupos.length,
                        }, 
                        tipoMaterial: {
                            nuevos: tiposmaterialInserciones.length,
                            editados: promesasTiposMaterial.length,
                        },
                    });
                    
                    // Se actualiza la info que se modifico en SAP
                    promesasTiposMaterial.length > 0 && await Promise.all(promesasTiposMaterial).catch(e => this.errorLog("synchronize.ErrorMongo.UPDATE.TIPOM", e));
                    promesasMarcas.length > 0 && await Promise.all(promesasMarcas).catch(e => this.errorLog("synchronize.ErrorMongo.UPDATE.MARCAS", e));
                    promesasGrupos.length > 0 && await Promise.all(promesasGrupos).catch(e => this.errorLog("synchronize.ErrorMongo.UPDATE.GRUPOS", e));
                    promesasProductos.length > 0 && await Promise.all(promesasProductos).catch(e => this.errorLog("synchronize.ErrorMongo.UPDATE.PRODUCTOS", e));

                    // Se inserta la info nueva devuelta por SAP
                    tiposmaterialInserciones.length > 0 && await this.sociedadService.tipoMService.createMany(tiposmaterialInserciones).catch(e => this.errorLog("synchronize.ErrorMongo.CREATE.TIPOM", e));
                    marcasInserciones.length > 0 && await this.marcaService.createMany(marcasInserciones).catch(e => this.errorLog("synchronize.ErrorMongo.CREATE.MARCAS", e));
                    gruposInserciones.length > 0 && await this.grupoService.createMany(gruposInserciones).catch(e => this.errorLog("synchronize.ErrorMongo.CREATE.GRUPOS", e));
                    inserciones.length > 0 && await this.createMany(inserciones).catch(e => this.errorLog("synchronize.ErrorMongo.CREATE.PRODUCTOS", e));

                    this.debugLog("synchronize.Update.End");
                }
            }

            this.debugLog("synchronize.END", {timeout: TIMEOUT});

            if (TIMEOUT > 0 && !materialesSAP)  {
                this.synchronize(TIMEOUT);
            }
        }, timeout);
    }

    async insertProduct(product: Product, userId: string): Promise<Product> {
        return new Promise(async(resolve, reject) => {
            
            const user = await this.userConfigService.getUserInfo(userId);
            if (!user) return reject({message: 'No se pudo obtener product del usuario'}); 

            product.nomenclatura = await this.defineNomenclador(product);
            product.estado = ProductState.INACTIVO;
            if (Array.isArray(product.centros)) product.centros = product.centros.join(",");
            
            if (!product.sociedad) {
                delete product.centros;
            }
            
            const item = await this.create(product);
            if (!item) return reject({message: 'No se pudo insertar el material'});

            return resolve(item);
        });
    }

    async updateProduct(product: Product, userId: string): Promise<Product> {
        return new Promise(async(resolve, reject) => {
            const user = await this.userConfigService.getUserInfo(userId);
            if (!user) return reject({message: 'No se pudo obtener informacion del usuario (Nro: '+userId+')'}); 
            
            if (!product.id) return reject({message: 'Ingrese el id del producto.'}); 
            
            if (Array.isArray(product.centros)) product.centros = product.centros.join(",");
            if (!product.sociedad) {
                delete product.centros;
            }

            const item = await this.update(product.id, product);
            if (!item) return reject({message: 'No se pudo actualizar el material'});            
            return resolve(product);
        });
    }

    private async getInfo(service: BaseFullService<any>, fvalues: any[], fieldName: string, fieldId: boolean): Promise<{id: string, name: string}[]> {
        
        let filter = {};

        if (fieldName != 'centro') {
            const array: string[] = [];
            fvalues.forEach(item => {
                this.addValue(array, item[fieldName])
            });        
            if (array.length == 0) return [];
            filter = fieldId ? {id: {$in: array}} : {_id: {$in: array}};
        }

        const itemsn = await service.findAll(filter);
        return itemsn.map(item => {
            return {
                id: item.id,
                name: item.name
            }
        });
    }

    private addValue(array: string[], value?: string, multiple: boolean = false) {
        if (multiple && value) {
            const itemsn = value.split(",");
            for (const item of itemsn) {
                this.addValue(array, item);
            }
            return;
        }

        if (!value || array.indexOf(value) >= 0) return;
        array.push(value);
    }

    async findAllConvert(ffilter: any, full?: boolean, username?: string, deposito?: string, timeout?: number) {        
        const items = await this.findAll(ffilter);
        const resp: ProductDTO[] = [];
                
        let marcas: any[] = [];
        let canales: any[] = [];
        let categorias: any[] = [];
        let tipomateriales: any[] = [];
        let tipoprecios: any[] = [];
        let idiomas: any[] = [];
        let paises: any[] = [];
        let ubicaciones: any[] = [];
        let materialidades: any[] = [];
        let almacenes: any[] = [];
        let sociedades: any[] = [];
        let centros: any[] = [];

        await Promise.all([
            this.getInfo(this.marcaService, items, 'marca', true),
            this.getInfo(this.sociedadService.canalService, items, 'canal', true),
            this.getInfo(this.sociedadService.categoriaService, items, 'categoria', true),
            this.getInfo(this.sociedadService.tipoMService, items, 'tipomaterial', true),
            this.getInfo(this.sociedadService.tipoPService, items, 'tipoprecio', true),
            this.getInfo(this.marcaService.idiomaService, items, 'idioma', true),
            this.getInfo(this.marcaService.paisService, items, 'pais', true),
            this.getInfo(this.marcaService.ubicacionService, items, 'ubicacion', true),
            this.getInfo(this.marcaService.materialService, items, 'materialidad', true),
            this.getInfo(this.marcaService.almacenService, items, 'almacen', false),
            this.getInfo(this.sociedadService, items, 'sociedad', false),
            this.getInfo(this.sociedadService.centroService, items, 'centro', false),
        ])
        .then(responses => {
            marcas = responses[0];
            canales = responses[1];
            categorias = responses[2];
            tipomateriales = responses[3];
            tipoprecios = responses[4];
            idiomas = responses[5];
            paises = responses[6];
            ubicaciones = responses[7];
            materialidades = responses[8];
            almacenes = responses[9];
            sociedades = responses[10];
            centros = responses[11];
        })
        .catch(errorFn);

        for (const item of items) {
            resp.push({
                ...item,
                imagenes: convertImages(item.imagenes, false),
                tipoprecio: tipoprecios.find(i => i.id == item.tipoprecio)?.name, 
                marca: marcas.find(i => i.id == item.marca)?.name, 
                tipomaterial: tipomateriales.find(i => i.id == item.tipomaterial)?.name, 
                categoria: categorias.find(i => i.id == item.categoria)?.name, 
                canal: canales.find(i => i.id == item.canal)?.name, 
                idioma: idiomas.find(i => i.id == item.idioma)?.name, 
                pais: paises.find(i => i.id == item.pais)?.name, 
                ubicacion: ubicaciones.find(i => i.id == item.ubicacion)?.name, 
                materialidad: materialidades.find(i => i.id == item.materialidad)?.name, 
                almacen: almacenes.find(i => i.id == item.almacen)?.name, 
                sociedad: sociedades.find(i => i.id == item.almacen)?.name, 
                centros: await this.getCentros(true, item.centros, centros)
            });
        }
        
        if (full && username != 'none') {
            await Promise.all(resp.map(item => {
                return new Promise<void>(async resolve => {
                    item.status = await this.defineStatus(item, username);
                    resolve();
                })
            }))
            .catch(errorFn);
        }

        if (deposito) {
            const stock = await this.getStockConsulta({username: "", userId: "", roles: []}, 
                resp.map(i => {
                    return {deposito, producto: i.codigosap}
                }), 
                timeout
            );

            resp.forEach(i => {
                const producto = stock.find(s => s.input.producto == i.codigosap);
                i.stock = parseNumber(producto?.available, -1).toString();
            });
        }

        return resp;        
    }

    async defineStatus(_item: ProductDTO, _username?: string): Promise<ProductStatus> {
        return 'full-edition';
    }

    private async getCentros(full: boolean, lcentros?: string | string[], allcentros: any[] | null = null) {
        const centros: any[] = !Array.isArray(lcentros) ? !lcentros ? [] : lcentros.split(",") : lcentros;

        if (Array.isArray(centros) && centros.length > 0) {
            if (centros.find(i => i == "all")) {
                return full ? "Todos los centros" : "all";
            }

            if (full) {
                const items = allcentros ? allcentros.filter(i => centros.indexOf(i.id) >= 0) : await this.sociedadService.centroService.findAll({_id: {$in: centros}});
                return items.map(i => i.name).join(",");
            }
            
            return centros.join(",");
        }
        return "";
    }

    async findOneConvert(id: string, username: string, full: boolean, loadedItem?: ProductDTO, fromsap: boolean = false) {
        const item: ProductDTO | undefined = loadedItem || (fromsap ? await this.findOne({codigosap: id}) : await this.findById(id));
        if (!item) return undefined;

        const getInfo = async (service?: BaseFullService<any>, value?: string): Promise<{name: string}> => {
            if (!service) {
                return {name: await this.getCentros(full, item.centros)};
            }
            if (!full || !value) return {name: toString(value)};            
            const resp = await service.findOne({id: value});
            if (resp?.name) return {name: resp.name};
            return {name: ""};
        }

        let marca = undefined;
        let canal = undefined;
        let categoria = undefined;
        let tipomaterial = undefined;
        let tipoprecio = undefined;
        let idioma = undefined;
        let pais = undefined;
        let ubicacion = undefined;
        let materialidad = undefined;
        let almacen = undefined;
        let sociedad = undefined;
        let centros = undefined;
        
        await Promise.all([
            getInfo(this.marcaService, item.marca),
            getInfo(this.sociedadService.canalService, item.canal),
            getInfo(this.sociedadService.categoriaService, item.categoria),
            getInfo(this.sociedadService.tipoMService, item.tipomaterial),
            getInfo(this.sociedadService.tipoPService, item.tipoprecio),
            getInfo(this.marcaService.idiomaService, item.idioma),
            getInfo(this.marcaService.paisService, item.pais),
            getInfo(this.marcaService.ubicacionService, item.ubicacion),
            getInfo(this.marcaService.materialService, item.materialidad),
            getInfo(this.marcaService.almacenService, item.almacen),
            getInfo(this.sociedadService, item.sociedad),
            getInfo(undefined, item.centros),            
        ])
        .then(responses => {
            marca = responses[0].name;
            canal = responses[1].name;
            categoria = responses[2].name;
            tipomaterial = responses[3].name;
            tipoprecio = responses[4].name;
            idioma = responses[5].name;
            pais = responses[6].name;
            ubicacion = responses[7].name;
            materialidad = responses[8].name;
            almacen = responses[9].name;
            sociedad = responses[10].name;
            centros = responses[11].name;
        })
        .catch(errorFn);

        return {
            ...item,
            imagenes: convertImages(item.imagenes, false),
            status: await this.defineStatus(item, username),
            tipoprecio,
            marca,
            tipomaterial,
            categoria,
            sociedad,
            canal,
            idioma,
            pais,
            ubicacion,
            materialidad,
            almacen,
            centros
        }        
    }
  
    async getNameFromService(service: BaseFullService<any>, id?: string): Promise<string> {
        if (!id) return "";
        const item = await service.findOne({id}).catch(errorFn);
        if (item) return item.name;
        return "";
    }

    async defineNomenclador(product: Product): Promise<string> {
        const tipoPName = await this.getNameFromService(this.sociedadService.tipoPService, product.tipoprecio);
        const marcaName = await this.getNameFromService(this.marcaService, product.marca);
        const tipoMName = await this.getNameFromService(this.sociedadService.tipoMService, product.tipomaterial);
        const categoriaName = await this.getNameFromService(this.sociedadService.categoriaService, product.categoria);
        const canalName = await this.getNameFromService(this.sociedadService.canalService, product.canal);
        
        const nomenclatura = 
            (tipoPName[0] || "A").toUpperCase() + '-' + 
            (new Date()).getFullYear().toString().substring(2, 4) + '-' + 
            marcaName.substring(0, 3).toUpperCase() + '-' +
            (tipoMName[0] || "P").toUpperCase() + '-' + 
            categoriaName.substring(0, 3).toUpperCase() + '-' +
            canalName.substring(0, 3).toUpperCase();
            const products = await this.findAll({});
            const count = products.filter(item => item.nomenclatura?.substring(0, nomenclatura.length) == nomenclatura).length + 1;
        return nomenclatura + '-' + (count < 10 ? '0' : '') + count.toString();
    }

    formatDate(fecha?: Date, days: number = 0): string {
       return formatDate(fecha, days);
    }

    private async getExcelProduct(caseId: string, username: string, product?: Product): Promise<Product | undefined> {
        if (!product) {
            const item = await this.findOne({idcaso: caseId});
            if (!item) return undefined;
            product = await this.findOneConvert(toString(item.id), username, true);
            if (!product) return undefined;
        }
        return product;
    }

    async generateExcel(caseId: string, username: string, response: HttpResponse, product?: Product) {
        product = await this.getExcelProduct(caseId, username, product);
        if (!product) return response.status(500).send({message: 'No se encontro el material asociado al caso'});
        
        const workbook = new excel.Workbook();        
        const options: Partial<excel.AddWorksheetOptions> = {
            views: [{
                showGridLines: false
            }]        
        };
        const worksheet = workbook.addWorksheet("POP", options);
        worksheet.columns = [
            {
                header: '',
                key: 'margin',
            },{
                header: 'UN.MED',
                key: 'unidadmedida',
            },{
                header: 'TIPO MAT',
                key: 'tipomaterial',
            },{
                header: 'G. Art.',
                key: 'gart',
            },{
                header: 'DESCRIPCIÓN (NOMENCLATURA) DEL MATERIAL (MÁXIMO 15 CH)',
                key: 'descripcion',
            },{
                header: 'COD. ESTADISTICO',
                key: 'codigo',
            },{
                header: 'TIPO DE POP',
                key: 'tipopop',
            },{
                header: 'MARCA',
                key: 'marca',
            },{
                header: 'NEGOCIO',
                key: 'negocio',
            },{
                header: 'SOCIEDAD',
                key: 'sociedad',
            },
            /*{
                header: 'SOCIEDAD',
                key: 'ar11',
            },{
                header: 'SOCIEDAD',
                key: 'ar12',
            },{
                header: 'SOCIEDAD',
                key: 'ar13',
            },{
                header: 'SOCIEDAD',
                key: 'ar14',
            },{
                header: 'SOCIEDAD',
                key: 'ar15',
            },{
                header: 'SOCIEDAD',
                key: 'ar22',
            },*/{
                header: 'CENTROS',
                key: 'centros',
            },
        ];

        worksheet.insertRow(1, {});        
        worksheet.insertRow(2, {margin: '', unidadmedida: 'Formulario para Crear POP-MP y Aux (Z008-Z011-Z012-Z014-Z019)'});       

        const data = worksheet.addRow({
            margin: '',
            unidadmedida: 'UN',
            tipomaterial: 'Z008',
            gart: '08-MATERIALES POP',
            descripcion: product.descripcion,
            codigo: "POP " + product.marca,
            tipopop: product.categoria,
            marca: product.marca,
            negocio: 'CERVEZA',
            sociedad: product.sociedad,
            centros: 'TODOS',
        });

        addDefaultRows(worksheet, data.values, data.number);
        
        const process = (row: excel.Row, rowNumber: number) => {
            if (rowNumber == 2) row.height = 20;
            row.eachCell((cell, colNumber) => getExcelRow(cell, colNumber, rowNumber));
            row.commit();
        }

        worksheet.eachRow(process);
             
        worksheet.columns.forEach((column) => {
            const lengths = (column.values || []).map((v, i) => i < 3 ? 0 : toString(v).toString().length);
            const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
            column.width = maxLength + 5;
        });

        worksheet.mergeCells([2, 2, 2, worksheet.columns.length]);
        const pathname = (new Date()).getTime().toString() + '.xlsx';
        
        response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=" + pathname);
        await workbook.xlsx.write(response)
        response.status(200).end();
    }

    getProductCode = (item: Product | undefined): string => {
        return item?.codigotruck 
            ? padLeadingZeros(item.codigotruck, 6) 
            : item?.nomenclatura 
                ? item.nomenclatura 
                : "Desconocido"
    }

}
