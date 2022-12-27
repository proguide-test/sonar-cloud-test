import { Injectable } from '@nestjs/common';
import { LegacyBaseService, LegacyConfigResponse, LegacyType } from './legacybase.service';

export interface StockConsultaInput {
  deposito: string;
  producto: string;
}

export interface StockConsultaOutput {
  available: number;
  compromised: number;
  code: string;
  input: StockConsultaInput;
}

@Injectable()
export class StockConsultaService extends LegacyBaseService<StockConsultaInput, StockConsultaOutput> {

  getName(): LegacyType {
    return LegacyType.StockConsulta;
  }

  getBody(params?: StockConsultaInput): string {
    return `
    <wsdl:m_WS_WEBPOP_CONSULTA_STOCKRequest>
      <wsdl:m_WS_WEBPOP_CONSULTA_STOCKRequestElement>
          <wsdl:DEPOSITO>${params?.deposito}</wsdl:DEPOSITO>
          <wsdl:PRODUCTID>${params?.producto}</wsdl:PRODUCTID>
      </wsdl:m_WS_WEBPOP_CONSULTA_STOCKRequestElement>
    </wsdl:m_WS_WEBPOP_CONSULTA_STOCKRequest>
    `
  }

  /*
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<n5:Envelope xmlns:http="http://schemas.xmlsoap.org/wsdl/http/" xmlns:n3="http://www.w3.org/2003/05/soap-envelope"
	xmlns:n="http://www.informatica.com/wsdl/" xmlns:n5="http://schemas.xmlsoap.org/soap/envelope/"
	xmlns:xml="http://www.w3.org/XML/1998/namespace" xmlns:n7="http://schemas.xmlsoap.org/wsdl/"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<n5:Body>
		<n:m_WS_WEBPOP_CONSULTA_STOCKResponse>
			<n:m_WS_WEBPOP_CONSULTA_STOCKResponseElement>
				<n:COD_RETORNO>E</n:COD_RETORNO>
				<n:STOCK_AVAILABLE>0.000000000</n:STOCK_AVAILABLE>
				<n:STOCK_COMPROMISED>0.000000000</n:STOCK_COMPROMISED>
			</n:m_WS_WEBPOP_CONSULTA_STOCKResponseElement>
		</n:m_WS_WEBPOP_CONSULTA_STOCKResponse>
	</n5:Body>
</n5:Envelope>
    */
  getConfigResponse(): LegacyConfigResponse {
    return {
      relashionship: [
        {
          propname: 'available',
          xmlpropname: 'n:m_WS_WEBPOP_CONSULTA_STOCKResponseElement.n:STOCK_AVAILABLE',
          type: 'number',
        },{
          propname: 'compromised',
          xmlpropname: 'n:m_WS_WEBPOP_CONSULTA_STOCKResponseElement.n:STOCK_COMPROMISED',
          type: 'number',
        },{
          propname: 'code',
          xmlpropname: 'n:m_WS_WEBPOP_CONSULTA_STOCKResponseElement.n:COD_RETORNO'
        },
      ],
      node: 'n:m_WS_WEBPOP_CONSULTA_STOCKResponse',
    }
  }

}
