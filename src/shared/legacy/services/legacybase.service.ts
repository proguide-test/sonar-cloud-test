import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';    
import { ConfigService } from '../../config/config.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as xmlJs from 'xml-js';
import { errorFn, parseNumber, testIsRunning, toString } from '../../utils/utils';
import { Configuration } from '../../configuration/configuration.enum';
import { StockMovService } from '../../../stockmov/stockmov.service';
import { StockMovEnum } from '../../../stockmov/model/stockmovtipo.model';
import { configurationGet, JwtPayload } from '@proguidemc/http-module';
import { Observable } from 'rxjs';

type LegacyMethod = 'get' | 'post' | 'put';

export enum LegacyType {
  StockConsulta = 'stock.consulta',
  StockReserva = 'stock.reserva',
  StockInterplanta = 'stock.interplanta',
  Materiales = 'materiales',
  PedidoComercial = 'pedido.comercial',
  UepUnassigned = 'uep.unassigned',
  OrdenConsulta = 'orden.consulta',
  Movimiento = 'movimiento',
}

export interface LegacyConfigResponse {
  soapenv?: string;
  node: string,
  relashionship: LegacyRelationship[];
  node0?: string;
  errorIfMessage?: boolean;
  typeOk?: string;
  header?: {
    wsdl?: {
      url?: string;
      prefix?: string;
    }
  }
}

@Injectable()
export abstract class LegacyBaseService<I, O> {

  abstract getName(): LegacyType;
  abstract getBody(params?: I): string;
  abstract getConfigResponse(): LegacyConfigResponse;
  
  private TIMEOUT: number = 0;
  private URL: string = '';
  private HEADERS: any;
  private CONFIG: {
    soapenv?: string,
    wsdl?: string,
  } = {};

  private test() {
    this.getConfigResponse();
    this.getBody();
    this.getName();
  }

  constructor(
    protected httpService: HttpService, 
    protected configService: ConfigService, 
    public stockMovService: StockMovService, 
  ) {
    const name = this.getName();    
    this.configService.findAll({name: {$in: ['legacy.' + name + '.timeout', 'legacy.' + name, 'legacy.header.' + name, 'legacy.header.default', 'legacy.config']}})
    .then(resp => {
      this.URL = toString(resp.find(i => i.name === 'legacy.' + name)?.value);
      if (this.URL.length < 5) this.URL = "";
      this.TIMEOUT = parseNumber(resp.find(i => i.name === 'legacy.' + name + '.timeout')?.value, 20000);
      this.HEADERS = resp.find(i => i.name === 'legacy.header.' + name)?.value || resp.find(i => i.name === 'legacy.header.default')?.value;
      this.CONFIG = resp.find(i => i.name === 'legacy.config')?.value;

      this.test();
    })
    .catch(errorFn);
  }

  private getError = (error: any): string => {
    const resp = error?.code == 'ECONNABORTED' ? "Timeout" : error?.response?.statusText || "Error Desconocido"
    return resp;
  }

  private getTimeout(timeout?: number): number {
    if (testIsRunning()) timeout = 1000;
    else if (!timeout) timeout = this.TIMEOUT;

    return timeout;
  }

  private async requestTest(method: LegacyMethod = 'get', body?: any, timeout?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = this.URL;
      if (!url) return reject({message: 'No esta configurada la url de acceso a ' + this.getName()})

      let observable: Observable<AxiosResponse<any>> | null = null;
      
      timeout = this.getTimeout(timeout);

      const options: AxiosRequestConfig = this.HEADERS || {
        timeout,
        headers: {
          "Content-Type": "application/json"
        }
      };

      const type = this.getName();
      
      const params = `/${type}?unregistered=true`;


      switch (method) {
        case 'get':
          options.timeout = Math.min(timeout, 5000);
          observable = this.httpService.post(this.PROXY_URL() + params, {url}, options);
          break;

        case 'put':
          observable = this.httpService.put(this.PROXY_URL() + params, body, options);
          break;
    
        default:
          observable = this.httpService.post(this.PROXY_URL() + params, {url, request: body}, options);
          break;
      }

      observable
      .subscribe({
        next: data => {
          if (data?.data) return resolve(data.data);
          return reject({message: 'Unknown Error'});
        },
        error: err => {
          const error = this.getError(err);
          return reject({message: error});
        },
      });
    });
  }

  private async request(method: LegacyMethod = 'get', body?: any, timeout?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      let url = this.URL;
      if (!url) return reject({message: 'No esta configurada la url de acceso a ' + this.getName()})

      if (method == 'get') url += "?WSDL";

      let observable: Observable<AxiosResponse<any>> | null = null;
      timeout = this.getTimeout(timeout);
      const options: AxiosRequestConfig = this.HEADERS || {
        timeout,
        headers: {
          "Content-Type": "text/xml;charset=UTF-8"
        }
      };

      switch (method) {
        case 'get':
          options.timeout = Math.min(timeout, 5000);
          observable = this.httpService.get(url, options);
          break;

        case 'put':
          observable = this.httpService.put(url, body, options);
          break;
    
        default:
          observable = this.httpService.post(url, body, options);
          break;
      }

      observable
      .subscribe({
        next: data => {
          if (data?.data) return resolve(data.data);
          return reject({message: 'Unknown Error'});
        },
        error: err => {
          const error = this.getError(err);
          return reject({message: error});
        },
      });
    });
  }

  wsdl(): Promise<string> {
    return this.PROXY_URL() ? this.requestTest('get') : this.request('get');
  }

  private valueOf(data: any, fieldNames: string, exclude?: string) {
    let resp = data;
    
    const names = fieldNames.split(".");
    for (const name of names) {
      if (!resp) {
        return ""
      }
      resp = resp[name];
    }
    
    if (exclude && exclude.split(",").indexOf(resp) >= 0) {
      return "";
    }

    return Array.isArray(resp) ? resp : toString(resp?._text); 
  }

  private parseDate(value: any) {
    if (value && value.length == 14) {
      //Ejemplo: 20201105000000
      const valueDate: string = value.substring(0, 4) + '-' + 
                                value.substring(4, 6) + '-' + 
                                value.substring(6, 8) + ' ' + 
                                value.substring(8, 10) + ':' + 
                                value.substring(10, 12) + ':' + 
                                value.substring(12, 14);
      return valueDate;
    }
    return '1900-01-01 00:00:00';    
  }

  protected transformResponse(data: any, relashionship: LegacyRelationship[], node0?: string) {
    let arrayData = null;
    
    if (node0 && Array.isArray(data[node0])) {
      arrayData = data[node0];
    } else if (Array.isArray(data)) {
      arrayData = data;
    }

    if (Array.isArray(arrayData)) {
      const responseArray: any[] = [];
      for (const item of arrayData) {
        responseArray.push(this.transformResponse(item, relashionship));
      }
      return responseArray;
    }

    const response: any = {};
    for (const relation of relashionship) {
      const value = this.valueOf(data, relation.xmlpropname, relation.exclude);
      if (Array.isArray(relation.childrens)) {
        response[relation.propname] = this.transformResponse(value, relation.childrens);
      } else {        
        switch (relation.type) {
          case 'number':
            response[relation.propname] = parseNumber(value);
            break;
          case 'date':
            response[relation.propname] = this.parseDate(value);            
            break;
          default:
            response[relation.propname] = value;
            break;
        }
      }
    }

    return response;
  }

  protected postResponse(user: JwtPayload, res: any, config: LegacyConfigResponse, params: I, _inicio: number): Promise<any> {
    return new Promise(async(resolve, reject) => {      
      let data: any = null;
      try {                    
        const jsonResponse = JSON.parse(xmlJs.xml2json(res, { compact: true, spaces: 4 }));
        data = jsonResponse[(config?.soapenv || 'n5') + ':Envelope'][(config?.soapenv || 'n5') + ':Body'][config.node];
      } catch (error) {
        data = null;      
      }
      
      if (data) {
        const response = this.transformResponse(data, config.relashionship, config.node0);
        
        if (config.typeOk && response?.type == config.typeOk) {
          if (response?.message) {
            response.message = "";
          }
        }
        
        if (config.errorIfMessage && response?.message) {
          return reject(response);
        }

        if (Array.isArray(response)) console.warn({url: this.URL, count: response.length});

        if (user?.username) {
          const name = this.getName();              
          if ([LegacyType.StockInterplanta, LegacyType.StockReserva].indexOf(name) >= 0) {
            
            const paramsRaw: any[] = Array.isArray((params as any)?.items) ? (params as any)?.items : [];
            const paramsDepositoOrigen: string = (params as any)?.depositoorigen || (params as any)?.deposito;
            const paramsDepositoDestino: string = (params as any)?.depositodestino || (params as any)?.deposito;
            const paramsTipoMov: StockMovEnum = (params as any)?.tipomov;                
            if (paramsTipoMov && paramsDepositoOrigen && paramsDepositoDestino && paramsRaw.length > 0) {
              paramsRaw.forEach(item => {
                this.stockMovService.register({
                  cantidad: parseNumber(item.cantidad),
                  materialid: item.producto,
                  usuario: user.username,
                  destinoid: paramsDepositoDestino,
                  origenid: paramsDepositoOrigen,
                  tipo: paramsTipoMov,
                }).catch(errorFn);
              });
            }
          }
        }
        resolve(response);
      } else {
        reject({message: 'Invalid Response'});
      }
    })
  }

  private PROXY_URL() {
    const resp = configurationGet(Configuration.PROXY_URL);
    if (toString(resp).length < 5) return "";
    return resp;
  }

  post(user: JwtPayload, params: I, timeout?: number): Promise<O> {
    return new Promise(async(resolve, reject) => {
      const config = this.getConfigResponse();
      const body = `
      <soapenv:Envelope xmlns:soapenv="${this.CONFIG?.soapenv || "https://schemas.xmlsoap.org/soap/envelope/"}" xmlns:${config?.header?.wsdl?.prefix || 'wsdl'}="${config?.header?.wsdl?.url || "https://www.informatica.com/wsdl/"}">
        <soapenv:Header/>
        <soapenv:Body>
          ${this.getBody(params)}
        </soapenv:Body>
      </soapenv:Envelope>  
      `;

      const promise = this.PROXY_URL() ? this.requestTest('post', body, timeout) : this.request('post', body, timeout)
      const inicio = (new Date()).getTime();

      promise
      .then(res => {
        this.postResponse(user, res, config, params, inicio)
        .then(resp => resolve(resp))
        .catch(error => {
          if (testIsRunning()) {
            resolve(Object.create(null));
          } else {
            reject(error)
          }
        });
      })
      .catch(e => {
        if (testIsRunning()) {
          resolve(Object.create(null));
        } else {
          reject(e);
        }
      });
    })      
  }

  proxy(body: ExternalBodyTest) {
    return new Promise((resolve, reject) => {
      if (!body?.url) return reject({message: 'Invalid Request'});   

      (body?.request ? this.request('post', body.request) : this.request('get'))
      .then(resp => resolve(resp))
      .catch(error => reject(error))
    });
  }

  unregisteredRequest(url: string, method: 'get' | 'post' | 'put' = 'get', body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        let observable: Observable<AxiosResponse<any>> | null = null;
        
        const options: AxiosRequestConfig = this.HEADERS || {
          timeout: this.TIMEOUT,
          headers: {
            "Content-Type": "text/xml;charset=UTF-8"
          }
        };

        switch (method) {
            case 'get':
                observable = this.httpService.get(url, options);
                break;
            case 'put':
                observable = this.httpService.put(url, body, options);
                break;
        
            default:
                observable = this.httpService.post(url, body, options);
                break;
        }

        observable
        .subscribe({
            next: data => {
                if (data?.data) return resolve(data.data);
                return reject({message: 'Unknown Error'});
            },
            error: err => {
                const error = this.getError(err);
                return reject({message: error});
            },
        });
    });
  }

  protected parseCodigoProducto(value: string): string {
    if (!value) return "";
    
    while (value.length < 18) {
      value = "0" + value.toString();
    }

    return value;
  }
  
  protected parseCantidad(value: number): string {
    return (value || 0).toFixed(2);
  }
  
}

export interface ExternalBodyTest {
  url: string;
  request?: any;
}

interface LegacyRelationship {
  propname: string,
  xmlpropname: string,
  exclude?: string,
  type?: 'number' | 'date',
  childrens?: LegacyRelationship[];  
}


  /*
  private testWsdlOC() {
    if (this.getName() !== LegacyType.OrdenConsulta) return;

    const wsdl = `
    <?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <n5:Envelope xmlns:http="http://schemas.xmlsoap.org/wsdl/http/" xmlns:n3="http://www.w3.org/2003/05/soap-envelope"
      xmlns:n="http://www.informatica.com/wsdl/" xmlns:n5="http://schemas.xmlsoap.org/soap/envelope/"
      xmlns:xml="http://www.w3.org/XML/1998/namespace" xmlns:n7="http://schemas.xmlsoap.org/wsdl/"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <n5:Body>
        <n:WS_EBUY_TESTResponse>
          <n:WS_EBUY_TESTResponseElement>
            <n:PROV_ID>0000300435</n:PROV_ID>
            <n:NUM_DOC>4508285670</n:NUM_DOC>
            <n:USER_ID>29023403</n:USER_ID>
            <n:PLANTA>AR08</n:PLANTA>
            <n:F_CREACION>20201006000000</n:F_CREACION>
            <n:RE_MODIFICACION>20220316154556</n:RE_MODIFICACION>
            <n:DESTINY_CODE>AR02</n:DESTINY_CODE>
            <n:CURRENCY>USD</n:CURRENCY>
            <n:PAY_CONDITION>I100</n:PAY_CONDITION>
            <n:ESTADO>A</n:ESTADO>
            <n:TIPO_OC>A</n:TIPO_OC>
            <n:TIPO_DOC>P</n:TIPO_DOC>
            <n:EMPID>AR3350835825</n:EMPID>
            <n:TI_PEDIDOSP>
              <n:PROV_ID>0000300435</n:PROV_ID>
              <n:NUM_DOC>4508285670</n:NUM_DOC>
              <n:POSICION>10.000000000000000</n:POSICION>
              <n:ENTREGA>00000</n:ENTREGA>
              <n:MATERIAL>P450828567000010</n:MATERIAL>
              <n:QUANTITY>1</n:QUANTITY>
              <n:QUANTITY_UNIT>SV</n:QUANTITY_UNIT>
              <n:PRICE> 980.0000</n:PRICE>
              <n:PRICE_UNIT>USD</n:PRICE_UNIT>
              <n:DELIVERY_DATE>20201105000000</n:DELIVERY_DATE>
              <n:NET_VALUE> 980.0000</n:NET_VALUE>
              <n:CASH_VALUE> 980.0000</n:CASH_VALUE>
              <n:GROSS_VALUE> 980.0000</n:GROSS_VALUE>
              <n:IVA>C1</n:IVA>
              <n:DESTINO>3000</n:DESTINO>
              <n:SERVICIO>AR08</n:SERVICIO>
              <n:CANT_BASE>1.000000000000000</n:CANT_BASE>
              <n:PLANTA>SV</n:PLANTA>
              <n:DESC_MATERIAL>Mant y calib Eq de Linea (Elab y envasa)</n:DESC_MATERIAL>
              <n:POS_SOLICITUD>10.000000000000000</n:POS_SOLICITUD>
              <n:PROVINCIA_ENTREGA>01</n:PROVINCIA_ENTREGA>
              <n:EMPID>AR3350835825</n:EMPID>
            </n:TI_PEDIDOSP>
            <n:TI_PEDIDOSP>
              <n:PROV_ID>0000300435</n:PROV_ID>
              <n:NUM_DOC>4508285670</n:NUM_DOC>
              <n:POSICION>10.000000000000000</n:POSICION>
              <n:ENTREGA>00010</n:ENTREGA>
              <n:MATERIAL>S000000000003010177</n:MATERIAL>
              <n:QUANTITY>1</n:QUANTITY>
              <n:QUANTITY_UNIT>SV</n:QUANTITY_UNIT>
              <n:PRICE> 980.000</n:PRICE>
              <n:PRICE_UNIT>USD</n:PRICE_UNIT>
              <n:DELIVERY_DATE>20201105000000</n:DELIVERY_DATE>
              <n:NET_VALUE> 980.0000</n:NET_VALUE>
              <n:CASH_VALUE> 980.0000</n:CASH_VALUE>
              <n:GROSS_VALUE> 980.0000</n:GROSS_VALUE>
              <n:IVA>C1</n:IVA>
              <n:DESTINO>3000</n:DESTINO>
              <n:CANT_BASE>1.000000000000000</n:CANT_BASE>
              <n:PLANTA>SV</n:PLANTA>
              <n:SERVICIO>AR08</n:SERVICIO>
              <n:POS_SOLICITUD>10.000000000000000</n:POS_SOLICITUD>
              <n:PROVINCIA_ENTREGA>01</n:PROVINCIA_ENTREGA>
              <n:EMPID>AR3350835825</n:EMPID>
            </n:TI_PEDIDOSP>
            <n:TI_PEDIDOSP>
              <n:PROV_ID>0000300435</n:PROV_ID>
              <n:NUM_DOC>4508285670</n:NUM_DOC>
              <n:POSICION>20.000000000000000</n:POSICION>
              <n:ENTREGA>00000</n:ENTREGA>
              <n:MATERIAL>P450828567000020</n:MATERIAL>
              <n:QUANTITY>1</n:QUANTITY>
              <n:QUANTITY_UNIT>SV</n:QUANTITY_UNIT>
              <n:PRICE> 965.3400</n:PRICE>
              <n:PRICE_UNIT>USD</n:PRICE_UNIT>
              <n:DELIVERY_DATE>20201105000000</n:DELIVERY_DATE>
              <n:NET_VALUE> 965.3400</n:NET_VALUE>
              <n:CASH_VALUE> 965.3400</n:CASH_VALUE>
              <n:GROSS_VALUE> 965.3400</n:GROSS_VALUE>
              <n:IVA>C1</n:IVA>
              <n:DESTINO>3000</n:DESTINO>
              <n:CANT_BASE>1.000000000000000</n:CANT_BASE>
              <n:PLANTA>SV</n:PLANTA>
              <n:SERVICIO>AR08</n:SERVICIO>
              <n:DESC_MATERIAL>Mant y calib Eq de Linea (Elab y envasa)</n:DESC_MATERIAL>
              <n:POS_SOLICITUD>10.000000000000000</n:POS_SOLICITUD>
              <n:PROVINCIA_ENTREGA>01</n:PROVINCIA_ENTREGA>
              <n:EMPID>AR3350835825</n:EMPID>
            </n:TI_PEDIDOSP>
            <n:TI_PEDIDOSP>
              <n:PROV_ID>0000300435</n:PROV_ID>
              <n:NUM_DOC>4508285670</n:NUM_DOC>
              <n:POSICION>20.000000000000000</n:POSICION>
              <n:ENTREGA>00010</n:ENTREGA>
              <n:MATERIAL>S000000000003010177</n:MATERIAL>
              <n:QUANTITY>1</n:QUANTITY>
              <n:QUANTITY_UNIT>SV</n:QUANTITY_UNIT>
              <n:PRICE> 965.340</n:PRICE>
              <n:PRICE_UNIT>USD</n:PRICE_UNIT>
              <n:DELIVERY_DATE>20201105000000</n:DELIVERY_DATE>
              <n:NET_VALUE> 965.3400</n:NET_VALUE>
              <n:CASH_VALUE> 965.3400</n:CASH_VALUE>
              <n:GROSS_VALUE> 965.3400</n:GROSS_VALUE>
              <n:IVA>C1</n:IVA>
              <n:DESTINO>3000</n:DESTINO>
              <n:CANT_BASE>1.000000000000000</n:CANT_BASE>
              <n:PLANTA>SV</n:PLANTA>
              <n:SERVICIO>AR08</n:SERVICIO>
              <n:POS_SOLICITUD>10.000000000000000</n:POS_SOLICITUD>
              <n:PROVINCIA_ENTREGA>01</n:PROVINCIA_ENTREGA>
              <n:EMPID>AR3350835825</n:EMPID>
            </n:TI_PEDIDOSP>
          </n:WS_EBUY_TESTResponseElement>
          <n:WS_EBUY_TESTResponseElement>
            <n:PROV_ID>0000406636</n:PROV_ID>
            <n:NUM_DOC>4600039520</n:NUM_DOC>
            <n:USER_ID>29025039</n:USER_ID>
            <n:F_CREACION>20181031000000</n:F_CREACION>
            <n:RE_MODIFICACION>20220316113841</n:RE_MODIFICACION>
            <n:DESTINY_CODE>AR05</n:DESTINY_CODE>
            <n:CURRENCY>ARS</n:CURRENCY>
            <n:PAY_CONDITION>I030</n:PAY_CONDITION>
            <n:ESTADO>A</n:ESTADO>
            <n:TIPO_OC>A</n:TIPO_OC>
            <n:TIPO_DOC>A</n:TIPO_DOC>
            <n:EMPID>AR3350835825</n:EMPID>
            <n:TI_PEDIDOSP>
              <n:PROV_ID>0000406636</n:PROV_ID>
              <n:NUM_DOC>4600039520</n:NUM_DOC>
              <n:POSICION>10.000000000000000</n:POSICION>
              <n:ENTREGA>00000</n:ENTREGA>
              <n:MATERIAL>P460003952000010</n:MATERIAL>
              <n:QUANTITY>0</n:QUANTITY>
              <n:QUANTITY_UNIT>SV</n:QUANTITY_UNIT>
              <n:PRICE> 1.0000</n:PRICE>
              <n:PRICE_UNIT>ARS</n:PRICE_UNIT>
              <n:DELIVERY_DATE>20201105000000</n:DELIVERY_DATE>
              <n:NET_VALUE> 0.0000</n:NET_VALUE>
              <n:CASH_VALUE> 1.0000</n:CASH_VALUE>
              <n:GROSS_VALUE> 1.0000</n:GROSS_VALUE>
              <n:IVA>C1</n:IVA>
              <n:CANT_BASE>1.000000000000000</n:CANT_BASE>
              <n:PLANTA>SV</n:PLANTA>
              <n:DESC_MATERIAL>Adicional LOG Alquiler</n:DESC_MATERIAL>
              <n:POS_SOLICITUD>0.000000000000000</n:POS_SOLICITUD>
              <n:PROVINCIA_ENTREGA>01</n:PROVINCIA_ENTREGA>
              <n:EMPID>AR3350835825</n:EMPID>
            </n:TI_PEDIDOSP>
            <n:TI_PEDIDOSP>
              <n:PROV_ID>0000406636</n:PROV_ID>
              <n:NUM_DOC>4600039520</n:NUM_DOC>
              <n:POSICION>10.000000000000000</n:POSICION>
              <n:ENTREGA>00010</n:ENTREGA>
              <n:MATERIAL>S000000000003050611</n:MATERIAL>
              <n:QUANTITY>1</n:QUANTITY>
              <n:QUANTITY_UNIT>SV</n:QUANTITY_UNIT>
              <n:PRICE> 1.000</n:PRICE>
              <n:PRICE_UNIT>ARS</n:PRICE_UNIT>
              <n:DELIVERY_DATE>20201105000000</n:DELIVERY_DATE>
              <n:NET_VALUE> 1.0000</n:NET_VALUE>
              <n:CASH_VALUE> 1.0000</n:CASH_VALUE>
              <n:GROSS_VALUE> 1.0000</n:GROSS_VALUE>
              <n:IVA>C1</n:IVA>
              <n:CANT_BASE>1.000000000000000</n:CANT_BASE>
              <n:PLANTA>SV</n:PLANTA>
              <n:POS_SOLICITUD>0.000000000000000</n:POS_SOLICITUD>
              <n:PROVINCIA_ENTREGA>01</n:PROVINCIA_ENTREGA>
              <n:EMPID>AR3350835825</n:EMPID>
            </n:TI_PEDIDOSP>
            <n:TI_PEDIDOSP>
              <n:PROV_ID>0000406636</n:PROV_ID>
              <n:NUM_DOC>4600039520</n:NUM_DOC>
              <n:POSICION>20.000000000000000</n:POSICION>
              <n:ENTREGA>00000</n:ENTREGA>
              <n:MATERIAL>P460003952000020</n:MATERIAL>
              <n:QUANTITY>0</n:QUANTITY>
              <n:QUANTITY_UNIT>SV</n:QUANTITY_UNIT>
              <n:PRICE> 1.0000</n:PRICE>
              <n:PRICE_UNIT>ARS</n:PRICE_UNIT>
              <n:DELIVERY_DATE>20201105000000</n:DELIVERY_DATE>
              <n:NET_VALUE> 0.0000</n:NET_VALUE>
              <n:CASH_VALUE> 1.0000</n:CASH_VALUE>
              <n:GROSS_VALUE> 1.0000</n:GROSS_VALUE>
              <n:IVA>C1</n:IVA>
              <n:CANT_BASE>1.000000000000000</n:CANT_BASE>
              <n:PLANTA>SV</n:PLANTA>
              <n:DESC_MATERIAL>Adicional LOG Desvinculaciones</n:DESC_MATERIAL>
              <n:POS_SOLICITUD>0.000000000000000</n:POS_SOLICITUD>
              <n:PROVINCIA_ENTREGA>01</n:PROVINCIA_ENTREGA>
              <n:EMPID>AR3350835825</n:EMPID>
            </n:TI_PEDIDOSP>
            <n:TI_PEDIDOSP>
              <n:PROV_ID>0000406636</n:PROV_ID>
              <n:NUM_DOC>4600039520</n:NUM_DOC>
              <n:POSICION>20.000000000000000</n:POSICION>
              <n:ENTREGA>00010</n:ENTREGA>
              <n:MATERIAL>S000000000003059891</n:MATERIAL>
              <n:QUANTITY>1</n:QUANTITY>
              <n:QUANTITY_UNIT>SV</n:QUANTITY_UNIT>
              <n:PRICE> 1.000</n:PRICE>
              <n:PRICE_UNIT>ARS</n:PRICE_UNIT>
              <n:DELIVERY_DATE>20201105000000</n:DELIVERY_DATE>
              <n:NET_VALUE> 1.0000</n:NET_VALUE>
              <n:CASH_VALUE> 1.0000</n:CASH_VALUE>
              <n:GROSS_VALUE> 1.0000</n:GROSS_VALUE>
              <n:IVA>C1</n:IVA>
              <n:CANT_BASE>1.000000000000000</n:CANT_BASE>
              <n:PLANTA>SV</n:PLANTA>
              <n:POS_SOLICITUD>0.000000000000000</n:POS_SOLICITUD>
              <n:PROVINCIA_ENTREGA>01</n:PROVINCIA_ENTREGA>
              <n:EMPID>AR3350835825</n:EMPID>
            </n:TI_PEDIDOSP>
            <n:TI_PEDIDOSP>
              <n:PROV_ID>0000406636</n:PROV_ID>
              <n:NUM_DOC>4600039520</n:NUM_DOC>
              <n:POSICION>30.000000000000000</n:POSICION>
              <n:ENTREGA>00000</n:ENTREGA>
              <n:MATERIAL>P460003952000030</n:MATERIAL>
              <n:QUANTITY>0</n:QUANTITY>
              <n:QUANTITY_UNIT>SV</n:QUANTITY_UNIT>
              <n:PRICE> 5000.0000</n:PRICE>
              <n:PRICE_UNIT>ARS</n:PRICE_UNIT>
              <n:DELIVERY_DATE>20201105000000</n:DELIVERY_DATE>
              <n:NET_VALUE> 0.0000</n:NET_VALUE>
              <n:CASH_VALUE> 5000.0000</n:CASH_VALUE>
              <n:GROSS_VALUE> 5000.0000</n:GROSS_VALUE>
              <n:IVA>C1</n:IVA>
              <n:CANT_BASE>1.000000000000000</n:CANT_BASE>
              <n:PLANTA>SV</n:PLANTA>
              <n:DESC_MATERIAL>Serv. Distribución</n:DESC_MATERIAL>
              <n:POS_SOLICITUD>0.000000000000000</n:POS_SOLICITUD>
              <n:PROVINCIA_ENTREGA>01</n:PROVINCIA_ENTREGA>
              <n:EMPID>AR3350835825</n:EMPID>
            </n:TI_PEDIDOSP>
            <n:TI_PEDIDOSP>
              <n:PROV_ID>0000406636</n:PROV_ID>
              <n:NUM_DOC>4600039520</n:NUM_DOC>
              <n:POSICION>30.000000000000000</n:POSICION>
              <n:ENTREGA>00010</n:ENTREGA>
              <n:MATERIAL>S000000000003011354</n:MATERIAL>
              <n:QUANTITY>1</n:QUANTITY>
              <n:QUANTITY_UNIT>SV</n:QUANTITY_UNIT>
              <n:PRICE> 5000.000</n:PRICE>
              <n:PRICE_UNIT>ARS</n:PRICE_UNIT>
              <n:DELIVERY_DATE>20201105000000</n:DELIVERY_DATE>
              <n:NET_VALUE> 5000.0000</n:NET_VALUE>
              <n:CASH_VALUE> 5000.0000</n:CASH_VALUE>
              <n:GROSS_VALUE> 5000.0000</n:GROSS_VALUE>
              <n:IVA>C1</n:IVA>
              <n:CANT_BASE>1.000000000000000</n:CANT_BASE>
              <n:PLANTA>SV</n:PLANTA>
              <n:POS_SOLICITUD>0.000000000000000</n:POS_SOLICITUD>
              <n:PROVINCIA_ENTREGA>01</n:PROVINCIA_ENTREGA>
              <n:EMPID>AR3350835825</n:EMPID>
            </n:TI_PEDIDOSP>
          </n:WS_EBUY_TESTResponseElement>
        </n:WS_EBUY_TESTResponse>
      </n5:Body>
    </n5:Envelope>
    `
    const config = this.getConfigResponse();
    let data = null;
    try {                    
      const jsonResponse = JSON.parse(xmlJs.xml2json(wsdl, { compact: true, spaces: 4 }));
      data = jsonResponse[config?.soapenv || 'n5:Envelope'][config?.soapenv || 'n5:Body'][config.node];
    } catch (error) {
      data = null;      
    }

    if (data) {
      const response = this.transformResponse(data, config.relashionship, config.node0);
    } 
  }
  */