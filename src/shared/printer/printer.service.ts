import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import * as fs from "fs";
import * as path from "path";
import { errorFn, parseNumber, replaceAll, toString } from '../utils/utils';
import { AppModule } from '../../app.module';
const wkhtmltopdf = require('wkhtmltopdf');

export interface PrinterDataItem {
  name: string,
  value?: string,
  isTable?: boolean,
}

export type PrinterType =  'pallet' | 'planilla_armado' | 'planilla_despacho' | 'planilla_recepcion';

@Injectable()
export class PrinterService {

  constructor(public configService: ConfigService) {}

  async completeArray<T>(prefix: PrinterType, items: T[], blank: T, sufix?: string): Promise<T[]> {
    const linesForPage = parseNumber(await this.configService.find(prefix + '_' + (sufix || "lineas")));
    if (linesForPage > 0) {
        let lineCount = 0;
        while (items.length > lineCount) {
            lineCount = lineCount + linesForPage;
        }
        while (items.length < lineCount) {
          items.push(blank);
        }
    }
    return items;
  }

  async generate(username: string, prefix: PrinterType, data: PrinterDataItem[], download?: boolean, returnHTML?: boolean): Promise<string> {
    return new Promise(async resolve => {
      if (!prefix || !username || !Array.isArray(data) || data.length == 0) {
        return resolve("");
      }

      const baseUrl = toString(await this.configService.find("url").catch(errorFn), AppModule.URL);
      const URL = baseUrl + "/upload/printing/";

      const getFileName = (name?: string): string => {
        let resp =  path.join(__dirname, `../../../upload/printing`);
        if (!fs.existsSync(resp)) {
          fs.mkdirSync(resp);
        }
        if (name) resp += `/${name}`;
        return resp;
      }

      const debug = (await this.configService.find("print_debug").catch(errorFn)) == "1";
     
      // 1. Buscar template en DB
      let configTemplate = await this.configService.find(prefix + "_template").catch(errorFn);
      if (!configTemplate) {
          try {
            configTemplate = fs.readFileSync(getFileName(prefix + ".html"), 'utf-8');
          } catch (error) {
            configTemplate = "";
          }
      }
      
      if (!configTemplate) {
        console.error("printer.generate", username, prefix + ". Template no configurado");
        return resolve("");
      }
      
      let template: string = toString(configTemplate);
          
      const replaceIntoHtmlTable = (item: PrinterDataItem) => {        
        if (!item.isTable) {
          template = replaceAll(template, [`[${item.name.toLowerCase()}]`], [toString(item.value)]);
          return;
        }

        const beginStr = "<!-- BEGIN "+item.name.toUpperCase()+" -->";
        const endStr = "<!-- END "+item.name.toUpperCase()+" -->";
        const indexBegin = template.indexOf(beginStr, 0);
        const indexEnd = template.indexOf(endStr, 0);
        let json = null;
        if (indexBegin && indexEnd && indexBegin > 0 && indexBegin < indexEnd) {
          try {
            if (item.value) json = JSON.parse(item.value);
          } catch (error) {
            json = null;
          }                
          let fullValue = "";
          const content = template.substr(indexBegin + beginStr.length, indexEnd - indexBegin);
          // const content1 = template.substring(indexBegin + beginStr.length, indexEnd - indexBegin);
          try {
            if (Array.isArray(json)) {
              json.forEach(it => {
                let itemValue = content;
                for (const [key] of Object.entries(it)) {
                  try {                                  
                    const value = toString(it[key]).toString();
                    itemValue = replaceAll(itemValue, ["["+key.toLowerCase()+"]"], [value]);
                  } catch (error) {
                    itemValue = "";
                  }
                }
                fullValue += itemValue;
              });                          
            }
          } catch (error) {
            console.error("printer.generate", username, prefix + ".replace.table", error);
          }
          template = replaceAll(template, [content], [fullValue]);                  
        }
        template = replaceAll(template, [beginStr, endStr], ["", ""]);
      }
      
      for (const item of data) {
        replaceIntoHtmlTable(item);  
      }

      // 4. Generar pdf
      const name = username+".pdf";
      const fileNamePDF = getFileName(name);
      const fileNameHTML = getFileName(username + ".html");
      
      if (fs.existsSync(fileNamePDF)) fs.unlinkSync(fileNamePDF);
      if (fs.existsSync(fileNameHTML)) fs.unlinkSync(fileNameHTML);
                  
      template = template
      .replace(/á/g, '&aacute;')
      .replace(/é/g, '&eacute;')
      .replace(/í/g, '&iacute;')
      .replace(/ó/g, '&oacute;')
      .replace(/ú/g, '&uacute;')
      .replace(/ñ/g, '&ntilde;')
      .replace(/Á/g, 'A')
      .replace(/É/g, 'E')
      .replace(/Í/g, 'I')
      .replace(/Ó/g, 'O')
      .replace(/Ú/g, 'U')
      .replace(/Ñ/g, '&Ntilde;');
      
      try {
        template = replaceAll(template, ["[DIR]"], [getFileName()]);
        
        const replaceFile = (fileName: string, configName: string) => {
          const auxFileName = getFileName(fileName);
          let content = "";
          try {
            if (fs.existsSync(auxFileName)) {
              content = fs.readFileSync(auxFileName, 'utf-8');
            }
          } catch (error) {
            content = "";
          }

          template = replaceAll(template, ["["+configName+"]"], [content]);
        }

        replaceFile("bootstrap.css", 'bootstrapcss');
        replaceFile("bootstrap.js", 'bootstrapjs');
        replaceFile("leaflet.css", 'leafletcss');
        replaceFile("leaflet.js", 'leafletjs');
        
        template = replaceAll(template, ["[URL]", "./"], [URL, URL]);

        fs.writeFileSync(fileNameHTML, template);
      } catch (error) {
        console.error("printer.generate", username, prefix + ".write", error)
        return resolve("");
      }
  
      const convertFileNameToURL = (filename: string): string => {
        if (download) return filename;
        return `${URL}${name}`;
      }

      try {
        if (fs.existsSync(fileNameHTML) && !fs.existsSync(fileNamePDF)) {
          if (!returnHTML) {   
            
            const processConversor = function (_err: any, _stream: any) {
              if (!debug && fs.existsSync(fileNameHTML)) {
                fs.unlinkSync(fileNameHTML);
              }
            
              if (fs.existsSync(fileNamePDF)) {
                return resolve(convertFileNameToURL(fileNamePDF));
              } else {
                if (debug) {
                  console.error({_err, _stream});
                }
                return resolve("");
              }  
            }
            
            try {         
              wkhtmltopdf(template, { output: fileNamePDF }, processConversor);
            } catch (error) {
              console.error("conversion a pdf", error);
              processConversor(null, null);
            }
          } else {
            return resolve(convertFileNameToURL(fileNameHTML));
          }
        } else {
          return resolve("");
        }
      } catch (error) {
        console.error("printer.generate", username, prefix + ".general.error:", error);
        resolve("");
      }                    
    })
  }
}
