import { Injectable } from '@nestjs/common';
import { toString } from '../../utils/utils';
import { LegacyBaseService, LegacyConfigResponse, LegacyType } from './legacybase.service';

interface PedidoComercialInput {
  formaentrega: string;
  tipoventa: number;
  cliente?: number;
  deposito: number;
  producto: number;
  cantidad: number;
  uep?: string;
  nroserie?: number;
}

interface PedidoComercialOutput {
  type?: string;
  message?: string;
  status?: string;
}

@Injectable()
export class PedidoComercialService extends LegacyBaseService<PedidoComercialInput, PedidoComercialOutput> {
  
  getConfigResponse(): LegacyConfigResponse {
    return {
      relashionship: [
        {
          propname: 'type',
          xmlpropname: 'n:WS_WEBPOP_INTERFACE_SO2ResponseElement.n:TYPE'
        },{
          propname: 'message',
          xmlpropname: 'n:WS_WEBPOP_INTERFACE_SO2ResponseElement.n:MESSAGE'
        },{
          propname: 'status',
          xmlpropname: 'n:WS_WEBPOP_INTERFACE_SO2ResponseElement.n:OUT_POSICION.n:STATUS'
        },
      ],
      node: 'n:WS_WEBPOP_INTERFACE_SO2Response',
    }
  }
  
  getName(): LegacyType {
    return LegacyType.PedidoComercial;
  }

  getBody(params?: PedidoComercialInput): string {
    return `
    <wsdl:WS_WEBPOP_INTERFACE_SO2Request>
      <wsdl:WS_WEBPOP_INTERFACE_SO2RequestElement>
        <wsdl:FORMAENTREGA>${toString(params?.formaentrega)}</wsdl:FORMAENTREGA>
        <wsdl:TIPOVENTA>${toString(params?.tipoventa)}</wsdl:TIPOVENTA>
        <wsdl:CLIID>${toString(params?.cliente)}</wsdl:CLIID>
        <wsdl:DEPOSITO>${toString(params?.deposito)}</wsdl:DEPOSITO>
        <wsdl:POSICION>
            <wsdl:PRODUCTO_ID>${params?.producto}</wsdl:PRODUCTO_ID>
            <wsdl:CANTIDAD>${params?.cantidad}</wsdl:CANTIDAD>
            <wsdl:NRO_UEP>${toString(params?.uep)}</wsdl:NRO_UEP>
            <wsdl:SERIE>${toString(params?.nroserie)}</wsdl:SERIE>
        </wsdl:POSICION>
      </wsdl:WS_WEBPOP_INTERFACE_SO2RequestElement>
    </wsdl:WS_WEBPOP_INTERFACE_SO2Request>
    `
  }

}
