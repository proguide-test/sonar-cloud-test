import { Injectable } from '@nestjs/common';
import { LegacyBaseService, LegacyConfigResponse, LegacyType } from './legacybase.service';

export interface MovimientoInput {
  tipomov: string;
  productoid: string;
  centroorigen: string;
  tipo: string;
  centrodestino: string;
  motivo: string;
  cantidad: string;
  unidadmedida: string;
  docreferencia: string;
}

export interface MovimientoOutput {
  nrodoc?: string;
  ejerciciodoc?: string;
  numero?: string;
  message?: string;
  nrolog?: string;
}

@Injectable()
export class MovimientoService extends LegacyBaseService<MovimientoInput, MovimientoOutput> {

  /*
  <tns:MovimientoIndividualResponse>
    <Respuestas>
      <NroDocumentoMaterial>0</NroDocumentoMaterial>
      <EjercicioDocumentoMaterial>0</EjercicioDocumentoMaterial>
      <Retorno>
        <Numero>0</Numero>
        <Mensaje>Correspondence for the center does not exist</Mensaje>
        <NroLog>0</NroLog>
      </Retorno>
    </Respuestas>
  </tns:MovimientoIndividualResponse>
  */
  getConfigResponse(): LegacyConfigResponse {
    return {
      soapenv: 'n3',
      relashionship: [
        {
          propname: 'nrodoc',
          xmlpropname: 'Respuestas.NroDocumentoMaterial'
        },{
          propname: 'ejerciciodoc',
          xmlpropname: 'Respuestas.EjercicioDocumentoMaterial'
        },{
          propname: 'numero',
          xmlpropname: 'Respuestas.Retorno.Numero'
        },{
          propname: 'message',
          xmlpropname: 'Respuestas.Retorno.Mensaje'
        },{
          propname: 'nrolog',
          xmlpropname: 'Respuestas.Retorno.NroLog'
        },
      ],
      node: 'tns:MovimientoIndividualResponse',
      header: {
        wsdl: {
          url: "https://webpop.services.quilmes.com.ar/ConsumoMasivo/",
        }
      }
    }
  }

  getName(): LegacyType {
    return LegacyType.Movimiento;
  }

  getBody(params?: MovimientoInput): string {
    return `
    <wsdl:MovimientoIndividual>
      <Tipo>${params?.tipomov}</Tipo>
      <Material>
        <NumeroMaterial>${params?.productoid}</NumeroMaterial>
        <CentroOrigen>${params?.centroorigen}</CentroOrigen>
        <Tipo>${params?.tipo}</Tipo>
        <CentroDestino>${params?.centrodestino}</CentroDestino>
        <Motivo>${params?.motivo}</Motivo>
        <Cantidad>${params?.cantidad}</Cantidad>
        <UnidadMedida>${params?.unidadmedida}</UnidadMedida>
        <DocReferencia>${params?.docreferencia}</DocReferencia>
      </Material>
    </wsdl:MovimientoIndividual>
    `
  }

}
