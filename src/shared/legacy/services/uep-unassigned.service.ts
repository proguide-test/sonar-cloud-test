import { Injectable } from '@nestjs/common';
import { LegacyBaseService, LegacyConfigResponse, LegacyType } from './legacybase.service';

interface UepUnassignedInput {
  tipopedido: string;
  uep: string;
  nrodoc: number;
}

interface UepUnassignedOutput {
  
}

@Injectable()
export class UepUnassignedService extends LegacyBaseService<UepUnassignedInput, UepUnassignedOutput> {

  getConfigResponse(): LegacyConfigResponse {
    return {
      relashionship: [
        /*{
          propname: '',
          xmlpropname: 'n:m_WS_WEBPOP_INTERFACE_UNASSIGNEDResponseElement.n:STOCK_AVAILABLE'
        },*/
      ],
      node: 'n:m_WS_WEBPOP_INTERFACE_UNASSIGNEDResponse',
    }
  }

  getName(): LegacyType {
    return LegacyType.UepUnassigned;
  }

  getBody(params?: UepUnassignedInput): string {
    return `
    <wsdl:m_WS_WEBPOP_INTERFACE_UNASSIGNEDRequest>
      <wsdl:m_WS_WEBPOP_INTERFACE_UNASSIGNEDRequestElement>
        <wsdl:TIPO_PEDIDO>${params?.tipopedido}</wsdl:TIPO_PEDIDO>
        <wsdl:NRO_UEP_GENERADO>${params?.uep}</wsdl:NRO_UEP_GENERADO>
        <wsdl:NRO_DOCUMENTO>${params?.nrodoc}</wsdl:NRO_DOCUMENTO>
      </wsdl:m_WS_WEBPOP_INTERFACE_UNASSIGNEDRequestElement>
    </wsdl:m_WS_WEBPOP_INTERFACE_UNASSIGNEDRequest>
    `
  }

}
