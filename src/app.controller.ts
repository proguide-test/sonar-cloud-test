 import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AppService, AuthType, LoginParams } from './app.service';
import * as path from 'path';
import * as fs from 'fs';
import * as mime from 'mime-types';
import { getValueFile, getValue, emailIsValid, parseNumber, createFile, formatVisibledDate, padLeadingZeros, addDefaultRows, getExcelRow, toString, getFilterDate } from './shared/utils/utils';
import { ApiTags } from '@nestjs/swagger';
import { CartService } from './carrito/cart.service';
import { NameValue } from '@proguidemc/notification-module/lib/notification.interfaces';
import { buildTemplate } from '@proguidemc/notification-module/lib/notification.functions';
import { getResponsableTMRegion } from './carrito/model/cart.model';
import * as excel from 'exceljs';
import { BaseConfig, configurationGet, DBName, EndPointResponse, HttpRequest, HttpResponse } from '@proguidemc/http-module';
import { HttpService } from '@nestjs/axios';
import { AuthGuard } from '@nestjs/passport';
import { Region } from './shared/region/model/region.model';
import { Proveedor } from './shared/proveedor/model/proveedor.model';
import { Configuration } from './shared/configuration/configuration.enum';

@ApiTags("Root")
@Controller()
export class AppController {
    constructor(
        private appService: AppService,
        private cartService: CartService,
        protected httpService: HttpService,
    ) {}


    /*
        !METODOS OBLIGATORIOS PARA APIS DE INTEGRACION: /login, /company, /case (POST), /case (PUT)
    */

    @Post('/login')
    async saveLoad(
        @Body() payload: LoginParams,
        @Res() response: HttpResponse,
    ) {
        this.appService.login(payload)
        .then(info => {
            response.status(200).send({info});
        })
        .catch(error => {
            response.status(200).send(error);
        });
    }
    
    @Get('/company')
    async getCompany(
        @Query() _userName: string,
        @Res() response: HttpResponse,
    ) {    
        response.status(200).send({company: configurationGet(Configuration.COMPANY_ID)});
    }
    
    @Post('/case')
    async saveCase(
        @Body() payload: any,
        @Res() response: HttpResponse,
    ) {
        response.status(200).send(payload);        
    }

    @Put('/case')
    async updateCase(
        @Body() payload: any,
        @Res() response: HttpResponse,
    ) {
        response.status(200).send(payload);
    }

    @Delete('/case/:processKey/:id')
    async deleteCase(
        @Param('id') id: string,
        @Param('processKey') processKey: string,
        @Res() response: HttpResponse,
    ) {
        response.status(200).send({id, processKey});
    }

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
        @Headers('authorization') bearerToken: string,     
    ) {
        parseNumber('8,988.99');
        parseNumber('8.988,99');
        emailIsValid('mborgo@proguidemc.com');
        emailIsValid('m');
        getValue({name: 'test', enabled: false}, ["name"]);
        getValue({name: 'test', enabled: false}, [], "test");
        getValueFile('/', '', 'test', 'test1.png', {name: 'test.png'});
        getValueFile('/', '', 'test', 'test1.png', {name: 'test.png'}, true);
        getValueFile('/', '', 'test', 'test1.png', {name: 'test.png'}, false, {data: {name: 'test2', type: 'png'}});
        createFile('/', '', {path: 'test'}, false, {data: {name: 'test2', type: 'png'}});

        getFilterDate()
        getFilterDate("2022-01-01")
        getFilterDate("", "2022-01-01")
        getFilterDate("2022-01-01", "2022-02-01")
        
        getFilterDate("", "", true)
        getFilterDate("2022-01-01", "", true)
        getFilterDate("", "2022-01-01", true)
        getFilterDate("2022-01-01", "2022-02-01", true)
        
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
            {
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
            descripcion: '',
            codigo: "POP ",
            tipopop: '',
            marca: '',
            negocio: 'CERVEZA',
            sociedad: '',
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

        const testTableName = "palletestado";

        worksheet.mergeCells([2, 2, 2, worksheet.columns.length]);
        const pathname = path.join(__dirname, '../upload/'+testTableName+'.xlsx');        
        await workbook.xlsx.writeFile(pathname);
        
        await this.loadXmlData(testTableName, false);

        fs.unlinkSync(pathname);

        const fileName = path.join(__dirname, '../upload/'+testTableName+'.csv');
        
        await this.generateCsv(testTableName, {});
        
        if (fs.existsSync(fileName)) fs.unlinkSync(fileName);

        const region: Region | undefined = await this.appService.findOneFlex({dbname: DBName.ShoppingManager, tablename: 'region'}, {"users.0": {$exists: true}});
        if (region?.id && region.users) {
            await this.appService.validateUser('region', region.id, bearerToken, {roles: [], userId: 'guest', username: region.users[0].email || "test"});        
        }

        const proveedor: Proveedor | undefined = await this.appService.findOneFlex({dbname: DBName.ShoppingManager, tablename: 'proveedor'}, {emailc: {$exists: true}});
        if (proveedor?.id) {
            await this.appService.validateUser('supplier', proveedor.id, bearerToken, {roles: [], userId: 'guest', username: proveedor.emailc});
        }
        
        res.send({status: "OK"});
    }

    @Get('upload/:folder/:name')
    async start(
        @Param('folder') ffolder: string,
        @Param('name') name: string,
        @Query('download') download: boolean,
        @Res() res: HttpResponse,
    ) {
        let content = null;
        const folder = ffolder == 'none' ? '' : `${ffolder}/`;
        const fileName = path.join(__dirname, '../upload/'+folder+name);

        try {
            content = fs.readFileSync(fileName);
        } catch (error) {
            content = null;
        }

        if (!content) {
            res.status(404).send();
        } else {
            if (download) {
                res.download(fileName);
            } else {
                const mimetype = mime.lookup(fileName);      
                res.status(200)
                    .header('Cross-Origin-Resource-Policy', '*')
                    .header('Content-Type', mimetype.toString())
                    .send(content);
            }            
        }
    }

    @Get('anio')
    @EndPointResponse({summary: 'Obtener lista de años desde count actual hasta año actual.', operationId: 'años' })
    async getAnios(
        @Query('count') count: number,
        @Query('reverse') reverse: boolean,
        @Res() res: HttpResponse,
    ) {
        const year = (new Date()).getFullYear();
        const resp = [];
        if (parseNumber(count) <= 0) count = 5;

        while (count > 0) {
            const name = (year - count + 1).toString();
            resp.push({id: name, name: name});
            count--;
        }
        if (typeof(reverse) === 'boolean' && reverse) resp.reverse();
        res.send(resp);
    }

    @Get('template-test/:email')
    @EndPointResponse({summary: 'Permite testear templates de envio de mails.', operationId: 'template-test' })
    async testTemplate(
        @Param('email') email: string,               
        @Res() res: HttpResponse,
        @Query() query: { 
            cartid?: string,
            regionid?: string,
            link?: string,
            name: string,
            title?: string,
            channelId?: string,
        }, 
    ) {        
        try {
            const filter = query.cartid ? {_id: query.cartid} : {};
            const carrito = await this.cartService.findOne(filter);
            if (!carrito) return res.status(500).send({message: 'No existe el carrito'});
            
            const info: NameValue[] = [];

            for (const [key] of Object.entries(carrito)) {
                let value = (carrito as any)[key];
                switch (key.toLowerCase()) {
                    case 'productos': 
                        continue;                        
                    case 'createdat':
                    case 'updatedat':
                        value = formatVisibledDate(value);
                        break;
                    case 'numberid':
                        value = padLeadingZeros(value, 4);
                        break;
                }
                info.push({
                    name: key,
                    value
                });
            }

            info.push({
                name: 'productos',
                value: (await this.cartService.productService.findAll({_id: {$in: carrito.productos.map((i: any) => i.id)}}))
                .map((item, index) => {
                    return {
                        ...item, 
                        producto: item.name + ' - ' + item.nomenclatura,
                        cantidad: index + 9 
                    }
                })
            });
            
            if (query.regionid) {
                const region = await this.cartService.regionService.findOne({id: query.regionid});
                info.push({
                    name: 'region',
                    value: region?.name || 'NOMBRE DE REGION POR DEFECTO'
                });
                const responsableTM = getResponsableTMRegion(carrito, query.regionid, "USUARIO TM POR DEFECTO");
                info.push({
                    name: 'responsable',
                    value: responsableTM
                });
            } else {
                info.push({
                    name: 'region',
                    value: 'NOMBRE DE REGION POR DEFECTO'
                });
                info.push({
                    name: 'responsable',
                    value: "USUARIO TM POR DEFECTO"
                });
            }
            
            const date = await this.cartService.getDueDate(carrito);
            info.push({
                name: 'dia',
                value: date.date
            }); 

            info.push({
                name: 'hora',
                value: date.time
            }); 

            info.push({
                name: 'link',
                value: query.link || 'https://www.google.com.ar'
            });
            info.push({
                name: 'proveedor',
                value: 'NOMBRE DE PROVEEDOR POR DEFECTO'
            });

            let contentHTML = "";
            if (query.name == 'test') {
                contentHTML = "<html><body>TEST</body></html>";
            } else {
                const filename = path.join(__dirname, '../upload/' + query.name + '.html');
                contentHTML = fs.readFileSync(filename, 'utf-8');                
            }

            const template = buildTemplate(contentHTML, query.title || "Test Template", info);
            if (!template) return res.status(500).send({message: 'Error armando body de mail'});

            this.cartService.productService.userConfigService.notificationService.insertQueue({
                email, 
                title: template.title, 
                content: template.content, 
                channelId: query.channelId 
            })
            .then(_r => {
                res.status(200).send({message: 'Enviado con exito'});
            })
            .catch(e => {
                res.status(500).send({message: e?.message || 'Error en envio de notificacion'});
            });
        } catch (error) {
            res.status(500).send({message: 'No se encontro el template ' + query.name});
        }
    }

    @Get('load-xlsx-data/:name')
    @EndPointResponse({summary: 'Permite cargar un archivo xls y setear su data en la BBDD.', operationId: 'load-xlsx-data' })
    async loadXmlData(
        @Param('name') name: string,
        @Query('nextid') nextid: boolean,
        @Res() res?: HttpResponse,
        
    ) {
        /**
         * Este endpoint recibe como parametro un nombre de Archivo.xlsx.
         * El nombre del archivo debe ser el mismo nombre de la Tabla en la BBDD ShoppingManager.
         * La primer fila del documento xlsx corresponde a los atributos del documento que se insertara en la BBDD.
         * El resto de las filas corresponden a los datos que almacena x atributto.
         */        
        const filename = path.join(__dirname, '../upload/' + name + '.xlsx');
        const workbook = new excel.Workbook();
        return workbook.xlsx.readFile(filename)
        .then(async () => {
            const baseConfig: BaseConfig = {dbname: DBName.ShoppingManager, tablename: name};
            let nextId = parseNumber(await this.appService.maxFlex(baseConfig, "id"));
            const items: any[] = [];                
            workbook.worksheets.forEach(sheet => {
                for (let i = 2; i <= sheet.actualRowCount; i++) {
                    const item: any = {};
                    for (let j = 1; j <= sheet.actualColumnCount; j++) {
                        const attribute = sheet.getRow(1).getCell(j).toString();
                        item[attribute] = sheet.getRow(i).getCell(j).toString();
                    }
                    if (nextid) item["id"] = nextId.toString();
                    nextId = nextId + 1;
                    item["enabled"] = true;
                    items.push(item);
                }
            });
            this.appService.createManyFlex(baseConfig, items)
            .then(_resp => {
                res?.status(200).send({message: 'Datos cargados con exito'});
                return null;                
            })
            .catch(_error => {                
                res?.status(500).send({message: 'Error al cargar datos'})
                return null;
            });
        })
        .catch(_error => {
            res?.status(500).send({message: 'Error al cargar datos'})
            return null;
        });
    }

    @Get('generate-csv/:name')
    @EndPointResponse({summary: 'Permite cargar un archivo xls y setear su data en la BBDD.', operationId: 'load-xlsx-data' })
    async csv(
        @Param('name') name: string,
        @Query() query: any,
        @Res() res: HttpResponse,
    ) {        
        const resp = await this.generateCsv(name, query);
        if (resp.filename && fs.existsSync(resp.filename)) {
            res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
            res.setHeader('Content-disposition', 'attachment; filename=' + path.basename(resp.filename));
            res.setHeader('Content-type', mime.lookup(resp.filename).toString());
            fs.createReadStream(resp.filename).pipe(res);
            return;
        }        
        res.status(200).send({message: "No se pudo generar el archivo"});
    }

    @UseGuards(AuthGuard('jwt'))    
    @Get('authentication/:type/:id')
    @EndPointResponse({ summary: 'Validar token enviado por la region.', operationId: 'validar-token' })
    async validateToken(
        @Param("id") id: string,
        @Param("type") type: AuthType,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
        @Headers('authorization') bearerToken: string,     
    ) {
        this.appService.validateUser(type, id, bearerToken, req?.user)
        .then(resp => {
            res.status(200).send(resp);
        })
        .catch(error => {
            res.status(500).send(error);
        });
    }

    @Get('auth/:type/:id/:keytoken')
    @EndPointResponse({ summary: 'Validar token enviado por la region.', operationId: 'validar-token' })
    async validateCustomToken(
        @Param("id") id: string,
        @Param("type") type: AuthType,
        @Param("keytoken") keytoken: string,
        @Res() res: HttpResponse,
    ) {
        this.appService.validateCustomUser(type, id, keytoken)
        .then(resp => {
            res.status(200).send(resp);
        })
        .catch(error => {
            res.status(500).send(error);
        });
    }

    private async generateCsv(name: string, query: any = {}) {
        const items = await this.appService.findAllFlex({dbname: DBName.ShoppingManager, tablename: name}, query);
        if (items.length == 0) {
            return {message: 'No se encontraron datos para tabla ' + name};
        }

        const salida: any[] = [];
        const separator = ";";
        
        items.forEach(i => {
            delete i["__v"];
            delete i["_id"];
        });

        salida.push(
            Object.entries(items[0])
            .join(separator)
            .toUpperCase()
        );

        salida.push(...items.map(item => (
            Object.entries<any>(item)
            .map(i => toString(i[1]).toString().toUpperCase())
            .join(separator)
        )));
        
        const filename = path.join(__dirname, '../upload/' + name + '.csv');
        fs.writeFileSync(filename, salida.join('\r\n'));
        
        if (fs.existsSync(filename)) {
            return {filename};
        }
        
        return {message: "No se pudo generar el archivo"};
    }
}
