import { Injectable } from '@nestjs/common';
import { StockMovEnum } from '../../../stockmov/model/stockmovtipo.model';
import { toArray, toString } from '../../utils/utils';
import { LegacyBaseService, LegacyConfigResponse, LegacyType } from './legacybase.service';

export interface StockReservaInputItem {
  producto?: string;
  cantidad: number;
  uep?: string;
  nroserie?: string;
}

export interface StockReservaInput {
  tipomov: StockMovEnum,
  deposito: string;
  items: StockReservaInputItem[];
}

export interface StockReservaOutput {
  uep: string;
  type?: string;
  message?: string;
}

@Injectable()
export class StockReservaService extends LegacyBaseService<StockReservaInput, StockReservaOutput> {

  /*
  <n:WS_WEBPOP_INTERFACE_RESERVA_STOCKResponse>
    <n:WS_WEBPOP_INTERFACE_RESERVA_STOCKResponseElement>
      <n:NRO_UEP>1</n:NRO_UEP>
      <n:TYPE>E</n:TYPE>
      <n:MESSAGE>No records found in ZCENALM table.</n:MESSAGE>
    </n:WS_WEBPOP_INTERFACE_RESERVA_STOCKResponseElement>
  </n:WS_WEBPOP_INTERFACE_RESERVA_STOCKResponse>  
  */
  getConfigResponse(): LegacyConfigResponse {
    return {
      relashionship: [
        {
          propname: 'uep',
          xmlpropname: 'n:WS_WEBPOP_INTERFACE_RESERVA_STOCKResponseElement.n:NRO_UEP'
        },{
          propname: 'type',
          xmlpropname: 'n:WS_WEBPOP_INTERFACE_RESERVA_STOCKResponseElement.n:TYPE'
        },{
          propname: 'message',
          xmlpropname: 'n:WS_WEBPOP_INTERFACE_RESERVA_STOCKResponseElement.n:MESSAGE'
        },
      ],
      typeOk: 'S',
      errorIfMessage: true,
      node: 'n:WS_WEBPOP_INTERFACE_RESERVA_STOCKResponse',
    }
  }

  getName(): LegacyType {
    return LegacyType.StockReserva;
  }

  getBody(params?: StockReservaInput): string {
    let body = '';
    toArray(params?.items).forEach(item => (
      body += `
      <wsdl:POSICION>
        <wsdl:PRODUCTO_ID>${item.producto}</wsdl:PRODUCTO_ID>
        <wsdl:CANTIDAD>${item.cantidad}</wsdl:CANTIDAD>
        <wsdl:NRO_UEP>${toString(item.uep)}</wsdl:NRO_UEP>
        <wsdl:NRO_SERIE>${toString(item.nroserie)}</wsdl:NRO_SERIE>
      </wsdl:POSICION>
      `
    ));

    return `
    <wsdl:WS_WEBPOP_INTERFACE_RESERVA_STOCKRequest>
      <wsdl:WS_WEBPOP_INTERFACE_RESERVA_STOCKRequestElement>
        <wsdl:DEPOSITO>${params?.deposito}</wsdl:DEPOSITO>
        ${body}        
      </wsdl:WS_WEBPOP_INTERFACE_RESERVA_STOCKRequestElement>
    </wsdl:WS_WEBPOP_INTERFACE_RESERVA_STOCKRequest>
    `
  }

}
