import { Injectable } from '@nestjs/common';
import { LegacyBaseService, LegacyConfigResponse, LegacyType } from './legacybase.service';

interface MaterialesInput {
  tipo?: string;
  centro?: string;
  sociedad?: number;
}

export interface MaterialesOutput {
  codigosap: string,
  name: string,
  codigotruck: string,
  centros: string,
  tipomaterial: string,
  cantidadumb: number,
  grupo: string,
  gruponombre: string,
  marca: string,
  marcanombre: string,
  negocio: string,
  sabortruck: string,
  saborpla: string,
  liqmadre: string,
  marcavar: string,
  marcavarnombre: string,
  unidadumb: string,  
}

@Injectable()
export class MaterialesService extends LegacyBaseService<MaterialesInput, MaterialesOutput[]> {

  getConfigResponse(): LegacyConfigResponse {
    return {
      node: 'n:WS_WEBPOP_PRODUCT_MASTER_FILTER_v4Response',
      node0: 'n:WS_WEBPOP_PRODUCT_MASTER_FILTER_v4ResponseElement',
      relashionship: [       
        {
          propname: 'codigosap',
          xmlpropname: 'n:COD_SAP'
        },{
          propname: 'name',
          xmlpropname: 'n:DESC_TK'
        },{
          propname: 'codigotruck',
          xmlpropname: 'n:COD_TK'
        },{
          propname: 'centros',
          xmlpropname: 'n:CENTRO',
          exclude: '*',
        },{
          propname: 'tipomaterial',
          xmlpropname: 'n:TIPO_PROD'
        },{
          propname: 'cantidadumb',
          xmlpropname: 'n:CANT_UMB_1',
          type: 'number',
        },
        
        {
          propname: 'grupo',
          xmlpropname: 'n:GRUPO_ARTI'
        },{
          propname: 'gruponombre',
          xmlpropname: 'n:WGBEZ'
        },{
          propname: 'marca',
          xmlpropname: 'n:COD_MARCA'
        },{
          propname: 'marcanombre',
          xmlpropname: 'n:DESCR_MARCA'
        },
        
        {
          propname: 'negocio',
          xmlpropname: 'n:NEGOCIO'
        },
        
        {
          propname: 'sabortruck',
          xmlpropname: 'n:SABOR_TK'
        },{
          propname: 'saborpla',
          xmlpropname: 'n:SABOR_PLA'
        },{
          propname: 'liqmadre',
          xmlpropname: 'n:LIQ_MADRE'
        },{
          propname: 'marcavar',
          xmlpropname: 'n:COD_VAR_MARCA'
        },{
          propname: 'marcavarnombre',
          xmlpropname: 'n:DESCR_VAR_MARCA'
        },{
          propname: 'unidadumb',
          xmlpropname: 'n:UMB'
        },
        
        /*
        Campos que vienen en todos los registros el mismo valor
        {
          propname: 'tipomaterial',
          xmlpropname: 'n:DIVISION'
        },{
          propname: 'tipomaterial',
          xmlpropname: 'n:CALIBRE_TK'
        },{
          propname: 'tipomaterial',
          xmlpropname: 'n:COD_GRU'
        },{
          propname: 'tipomaterial',
          xmlpropname: 'n:DESCR_GRU'
        },*/
        

      ],      
    }
  }

  getName(): LegacyType {
    return LegacyType.Materiales;
  }

  getBody(params?: MaterialesInput): string {
    return `
    <wsdl:WS_WEBPOP_PRODUCT_MASTER_FILTER_v4Request>
      <wsdl:WS_WEBPOP_PRODUCT_MASTER_FILTER_v4RequestElement>
        <wsdl:SOCIEDAD>${params?.sociedad || "AR11"}</wsdl:SOCIEDAD>
        <wsdl:CENTRO>${params?.centro || "AR08"}</wsdl:CENTRO>
        <wsdl:TIPO_MATERIAL>${params?.tipo || "Z008"}</wsdl:TIPO_MATERIAL>
      </wsdl:WS_WEBPOP_PRODUCT_MASTER_FILTER_v4RequestElement>
    </wsdl:WS_WEBPOP_PRODUCT_MASTER_FILTER_v4Request>
    `
  }

}
