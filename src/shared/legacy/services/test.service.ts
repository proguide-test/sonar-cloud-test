import { Injectable } from '@nestjs/common';
import { JwtPayload } from '@proguidemc/http-module';
import { errorFn } from '../../utils/utils';
import { LegacyBaseService, LegacyConfigResponse, LegacyType } from './legacybase.service';

export interface TestInput {
  deposito: string;
  producto: string;
}

export interface TestOutput {
  available: number;
  compromised: number;
  code: string;
  input: TestInput;
}

@Injectable()
export class TestService extends LegacyBaseService<TestInput, TestOutput> {

  getName(): LegacyType {
    return LegacyType.StockConsulta;
  }

  getBody(params?: TestInput): string {
    return `
    <wsdl:m_WS_WEBPOP_CONSULTA_STOCKRequest>
      <wsdl:m_WS_WEBPOP_CONSULTA_STOCKRequestElement>
          <wsdl:DEPOSITO>${params?.deposito}</wsdl:DEPOSITO>
          <wsdl:PRODUCTID>${params?.producto}</wsdl:PRODUCTID>
      </wsdl:m_WS_WEBPOP_CONSULTA_STOCKRequestElement>
    </wsdl:m_WS_WEBPOP_CONSULTA_STOCKRequest>
    `
  }

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

  run(user: JwtPayload) {
    const res =`
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
    `;
    const params = {
      deposito: 'P70',
      producto: '7536295'
    };
    const config =  this.getConfigResponse();

    this.parseCantidad(10);
    this.parseCodigoProducto('test');
    
    return Promise.all([
      this.postResponse(user, res, config, params, (new Date()).getTime()).catch(errorFn),
      this.post(user, params).catch(errorFn),
      this.proxy({
        url: 'https://it-sap-ws.dev.abinbev-las.com:7333/wsh/services/RealTime/WS_WEBPOP_CONSULTA_STOCK',
        request: '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsdl="http://www.informatica.com/wsdl/"><soapenv:Header/><soapenv:Body><wsdl:m_WS_WEBPOP_CONSULTA_STOCKRequest><wsdl:m_WS_WEBPOP_CONSULTA_STOCKRequestElement><wsdl:DEPOSITO>P70</wsdl:DEPOSITO><wsdl:PRODUCTID>7536295</wsdl:PRODUCTID></wsdl:m_WS_WEBPOP_CONSULTA_STOCKRequestElement></wsdl:m_WS_WEBPOP_CONSULTA_STOCKRequest></soapenv:Body></soapenv:Envelope>'
      }).catch(errorFn),
      this.proxy({
        url: 'https://it-sap-ws.dev.abinbev-las.com:7333/wsh/services/RealTime/WS_WEBPOP_CONSULTA_STOCK',
      }).catch(errorFn),
    ]);
  }

}
