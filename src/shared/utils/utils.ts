import * as path from "path";
import * as fs from "fs";
import { AppModule } from "../../app.module";
import { completeText, formatDate, getValue, hasPermission, HttpRequest, HttpResponse, JwtPayload, parseNumber, testIsRunning, toString } from "@proguidemc/http-module";
import * as mime from 'mime-types';

import * as excel from 'exceljs';
import { DistribucionEstado } from "../estadodistribucion/model/estadodistribucion.model";
export * from "@proguidemc/http-module/lib/functions";

const Formidable = require('formidable');

const azul  = '5b9bd5';
const verde = '92d050';
const crema = 'ffe699';
export const ORIGENID = '1';
export const DESTINOID = '15';

export const arraySortedNumber = (array: any[], fieldName: string) => {
    const newArray = [...array];
    return newArray.sort((a, b) => (parseNumber(a[fieldName]) < parseNumber(b[fieldName]) ? -1 : 1));
}

export const getValueFile = (directory: string, subdir: string, key: string, source: string, item: any, onlyUrl?: boolean, fields?: any) => {
    const baseName = getValue(item, ["name","originalFilename"], path.basename(source));
    const ext = path.extname(source).toLowerCase();
    const fileName = key + '_' + (new Date()).getTime() + ext;
    const target = path.join(directory + '/', fileName);

    if (!fs.existsSync(target) && key !== 'test') {
        fs.renameSync(source, target);
    }

    let info = null;            
    try {
        info = JSON.parse(fields[`data${key.replace('file', '')}`]);
    } catch (error) {
        info = null;
    }

    if (info) {                       
        return JSON.stringify({
            name: getValue(info, ["name"], baseName),
            type: getValue(info, ["type"], 'unknown'),
            url: AppModule.URL + `/upload/${subdir}/${fileName}`
        });
    } 
    
    if (onlyUrl) {
        return AppModule.URL + `/upload/${subdir}/${fileName}`;
    } 

    return JSON.stringify({
                name: baseName,
                date: formatDate(),
                url: AppModule.URL + `/upload/${subdir}/${fileName}`
            });    
}

export const formatVisibledDate = (value?: string, includeTime: boolean = false, includeSeconds: boolean = true, days: number = 0): string => {
    const fecha = !value ? new Date() : new Date(value);
    const resp = formatDate(fecha, days, false, "/");
    
    if (includeTime) {
        const seconds = includeSeconds ? `:${completeText(fecha.getSeconds())}` : '';    
        return resp + seconds;
    }

    return resp.substring(0, 10);
}

export type ElementName = 'include-target' | 'include-all';
export type ComponentName = 'ordenes de entrega' | 'planillas de armado' | 'gestion de pallets' | 'planillas de despacho' | 'recepciones';

export const hasCustomPermission = (user: JwtPayload, componentName: ComponentName, elementName: ElementName): boolean => {
    let element = '';
    let prefix = '';
    let genre = 'todas';
    let target = 'destino';
    switch (componentName) {
        case 'ordenes de entrega':
            prefix = 'las ordenes'
            break;    
        case 'planillas de armado':
            prefix = 'las planillas de armado'
            break;    
        case 'planillas de despacho':
            prefix = 'las planillas de despacho'
            break;    
        case 'gestion de pallets':
            prefix = 'los pallets';
            genre = 'todos';
            break;    
        case 'recepciones':
            prefix = 'las recepciones';
            target = 'origen'
            break;  
    }

    switch (elementName) {
        case 'include-target':
            element = `ver listado de ${prefix} con ${target} igual a mi origen`;
            break;
    
        case 'include-all':
            element = `ver ${genre} ${prefix}`;
            break;
    }

    return hasPermission(user, 'modulocompras', componentName, element, true);
}

export const uploadFile = (req: HttpRequest, res: HttpResponse, subdir: string, size: number, config?: {withname?: string, withinfo?: string}) => {
    if (testIsRunning()) {
        return res.status(200).send({message: 'test'});
    }

    if (!size) size = 10;
    
    const dirBase = path.join(__dirname, `../../../upload`);
    if (!fs.existsSync(dirBase)) {
        fs.mkdirSync(dirBase);
    }                            

    const directory = path.join(dirBase, subdir);

    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }                            

    const form = Formidable();
    form.uploadDir = directory;
    form.keepExtensions = false;
    form.maxFileSize = size * 1024 * 1024;
    
    form.parse(req, (error: any, fields: any, files: any) => {
        if (error) {
            console.error("error", error);
            return res.status(500).send(error);
        }
        
        const onlyUrl = config && config?.withname != "1";
        const data = createFile(directory, subdir, files, onlyUrl, config?.withinfo == "1" ? fields : undefined);
    
        if (data.paths.length > 0) {
            return res.status(200).send(data.paths);
        }

        if (data.errors.length > 0) {
            return res.status(500).send(data.errors.join(',')); 
        }                    

        return res.status(200).send('');
    });      
}

export interface BasicInfo {
    [value: string]: any;
    enabled?: boolean;
}

export const basicNormalizeItems = (items?: BasicInfo[], combo?: boolean): BasicInfo[] => {
    if (!items) items = [];
            
    items.forEach(item => {
        item.enabled = item.enabled || false;
        if (item.image) {
            item.image = item.image.replace('{app}', AppModule.URL);
        }
    });

    if (combo) {
        items = items.map(item => {
            return {
                id: item.id,
                name: item.codigosap + ' - ' + item.name
            }
        });
    }

    return items;
}

export const responseDownload = (download: boolean, file: string, res: HttpResponse) => {
    if (download) {
        res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
        res.setHeader('Content-disposition', 'attachment; filename=' + path.basename(file));
        res.setHeader('Content-Type', mime.lookup(file).toString());
        fs.createReadStream(file).pipe(res);
    } else {
        res.status(200).send({filename: file});  
    }
}

export const addDefaultRows = (worksheet: excel.Worksheet, values: any, def: number) => {
    let index = def;
    while (index < 20) {            
        if (!Array.isArray(values)) {
            const itemn: any = {};
            for (const [key] of Object.entries(values)) {
                itemn[key] = '';
            }
            index = worksheet.addRow(itemn).number;
        } else {
            index = worksheet.addRow(values.map(_v => "")).number;
        }           
    }
}

export const getExcelRow = (cell: any, colNumber: number, rowNumber: number) => {
    if (colNumber > 1) {
        if (rowNumber == 2) {
            cell.font = {
                bold: true,
                color: { argb: 'ffffff' },
                size: 14,
                name: 'Calibri'
            };
            cell.fill = {
                type: 'pattern',                            
                pattern: 'solid',
                fgColor: { argb: azul },
            };                        
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
            };   
                                 
        } else if (rowNumber == 3) {
            cell.font = {
                bold: true,
                color: { argb: '000000' },
                size: 10,
                name: 'Calibri'
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: verde }
            };
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
            };                        
        } else {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: rowNumber == 4 ? crema : 'ffffff' }
            };
            cell.font = {
                color: { argb: '000000' },
                size: 11,
                name: 'Calibri'
            };

            if (colNumber < 4 || colNumber > 8) {
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle',
                };  
            }
        }

        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };                 
    }                                    
}

export const convertImages = (imagenes: any, reverse: boolean): string => {
    if (imagenes) {
        const array = imagenes.split ? imagenes.split(",") : [];
        const newArray = [];
        for (const img of array) {
            if (img.replace && img.length > 5) {
                if (reverse) {
                    newArray.push(img.replace(AppModule.URL, "{app}"));    
                } else {
                    newArray.push(img.replace("{app}", AppModule.URL));
                }                    
            }
        }
        imagenes = newArray.join(",");
    }

    return imagenes;
}

export const nextStatusIsValid = (current: DistribucionEstado, next: DistribucionEstado): boolean => {
    if (current === DistribucionEstado.Enviada && next === DistribucionEstado.Recibida) return true;
    if (current === DistribucionEstado.PendienteAsignacion && next === DistribucionEstado.Enviada) return true;
    if (current === DistribucionEstado.Recibida && (next === DistribucionEstado.PendienteAjuste || next === DistribucionEstado.Aceptada)) return true;
    if (current === DistribucionEstado.PendienteAjuste && next === DistribucionEstado.Recibida) return true;
    return false;
}

export function createFile(directory: string, subdir: string, files: any, onlyUrl?: boolean, fields?: any): { paths: string[]; errors: string[]; } {
    const paths: string[] = [];
    const errors: string[] = [];
    for (const [key, val] of Object.entries(files)) {
        const photo: any = val;
        const source = getValue(photo, ["path","filepath"]);
        if (source) {
            paths.push(getValueFile(directory, subdir, key, source, photo, onlyUrl, fields))
        }
    }
    return { paths, errors };
}

export const getFilterDate = (from?: string, to?: string, utc?: boolean): DateFilter => {
    if (toString(from).length < 10) {
        from = "";
    } else if (utc) {
        from += "T00:00:00.000Z";
    } else {
        from += " 00:00:00K";
    }

    if (toString(to).length < 10) {
        to = formatDate(undefined, 0, false, '-').substring(0, 10);
    } 
    
    if (utc) {
        to += "T23:59:59.999Z";
    } else {
        to += " 23:59:59K";
    }

    let filter: DateFilter = {
        $lte: toString(to),
    };

    if (from) {
        filter = {
            ...filter,
            $gte: from,
        }
    }
    
    return filter;
}

interface DateFilter {
    $gte?: string;
    $lte: string;    
}

export const applyFilterWitthPermission = (filter: any, includeAll: boolean, includeTargets: boolean, origenesid: string[], reverse: boolean = false) => {
    if (!includeAll) {
        if (includeTargets) {
            filter["$or"] = [
                {'origenid' : {$in : origenesid}},
                {'destinoid' : {$in : origenesid}}
            ];
        } else if (reverse) {
            filter["destinoid"] = {$in : origenesid};
        } else {
            filter["origenid"] = {$in : origenesid};
        }
    }
    return filter;
}

export const toBoolean = (value?: boolean, def?: boolean): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof def === 'boolean') return def;
    return false;    
}