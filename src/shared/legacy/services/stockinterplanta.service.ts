import { Injectable } from '@nestjs/common';
import { StockMovEnum } from '../../../stockmov/model/stockmovtipo.model';
import { toArray, toString } from '../../utils/utils';
import { LegacyBaseService, LegacyConfigResponse, LegacyType } from './legacybase.service';

export interface StockInterplantaInput {
  tipomov: StockMovEnum,
  depositoorigen: string;
  formaentrega?: string;
  items : {
    depositodestino: string;
    producto?: string;
    cantidad: number;
    uep?: string;
    nroserie?: string;
    cliente?: string;
  }[];
}

export interface StockInterplantaOutput {
  nrodoc?: string;
  nrocomercial?: string;
  ordertype?: string;
  type?: string;
  message?: string;
  status?: string;
}

@Injectable()
export class StockInterplantaService extends LegacyBaseService<StockInterplantaInput, StockInterplantaOutput> {

  /*
  <n:WS_WEBPOP_INTERFACE_STOResponse>
    <n:WS_WEBPOP_INTERFACE_STOResponseElement>
      <n:ORDER_TYPE>ZUB</n:ORDER_TYPE>
      <n:TYPE>E</n:TYPE>
      <n:MESSAGE>Los datos de cabecera del pedido todavía son erróneos</n:MESSAGE>
      <n:OUT_POSICION>
        <n:STATUS>Error</n:STATUS>
      </n:OUT_POSICION>
    </n:WS_WEBPOP_INTERFACE_STOResponseElement>
  </n:WS_WEBPOP_INTERFACE_STOResponse>
  */
  getConfigResponse(): LegacyConfigResponse {
    return {
      relashionship: [
        {
          propname: 'ordertype',
          xmlpropname: 'n:WS_WEBPOP_INTERFACE_STOResponseElement.n:ORDER_TYPE'
        },{
          propname: 'type',
          xmlpropname: 'n:WS_WEBPOP_INTERFACE_STOResponseElement.n:TYPE'
        },{
          propname: 'message',
          xmlpropname: 'n:WS_WEBPOP_INTERFACE_STOResponseElement.n:MESSAGE'
        },{
          propname: 'nrodoc',
          xmlpropname: 'n:WS_WEBPOP_INTERFACE_STOResponseElement.n:DOCUMENT_NUMBER'
        },{
          propname: 'status',
          xmlpropname: 'n:WS_WEBPOP_INTERFACE_STOResponseElement.n:OUT_POSICION.n:STATUS'
        },{
          propname: 'nrocomercial',
          xmlpropname: 'n:WS_WEBPOP_INTERFACE_STOResponseElement.n:OUT_POSICION.n:NRO_DOC_COMERCIAL'
        },
      ],

      typeOk: 'S',
      errorIfMessage: true,
      node: 'n:WS_WEBPOP_INTERFACE_STOResponse',
    }
  }

  getName(): LegacyType {
    return LegacyType.StockInterplanta;
  }

  getBody(params?: StockInterplantaInput): string {
    let body = '';
    toArray(params?.items).forEach(item => (
      body += `
      <wsdl:POSICION>
        <wsdl:PRODUCTO_ID>${item?.producto}</wsdl:PRODUCTO_ID>
        <wsdl:CANTIDAD>${item?.cantidad}</wsdl:CANTIDAD>
        <wsdl:DEPOSITO_DESTINO>${item?.depositodestino}</wsdl:DEPOSITO_DESTINO>
        <wsdl:NRO_UEP>${toString(item?.uep)}</wsdl:NRO_UEP>
        <wsdl:CLIID>${toString(item?.cliente)}</wsdl:CLIID>
        <wsdl:SERIE>${toString(item?.nroserie)}</wsdl:SERIE>
      </wsdl:POSICION>
      `
    ));

    return `
    <wsdl:WS_WEBPOP_INTERFACE_STORequest>
      <wsdl:WS_WEBPOP_INTERFACE_STORequestElement>
        <wsdl:FORMA_ENTREGA>${toString(params?.formaentrega)}</wsdl:FORMA_ENTREGA>
        <wsdl:DEPOSITO>${params?.depositoorigen}</wsdl:DEPOSITO>
        ${body}
      </wsdl:WS_WEBPOP_INTERFACE_STORequestElement>
    </wsdl:WS_WEBPOP_INTERFACE_STORequest>
    `
  }

}
