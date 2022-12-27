import { Injectable } from '@nestjs/common';
import { toString } from '../../utils/utils';
import { LegacyBaseService, LegacyConfigResponse, LegacyType } from './legacybase.service';

interface OrdenConsultaInput {
  proveedor?: number;
  grupo?: string;
  sociedad?: string;
  pedido?: string;
}

interface OrdenConsultaOutput {
  provinciaid: string,
  nrooc: string,
  userid: string,
  planta: string,
  fechacreacion: string,
  fechamodificacion: string,
  destino: string,
  moneda: string,
  condicionpago: string,
  estado: string,
  tipooc: string,
  tipodoc: string,
  empid: string,
  detalle: {
    provinciaid: string,
    nrooc: string,
    posicion : number,
    entrega: string,
    materialid: string,
    materialnombre: string,
    cantidad: number,
    cantidadunidad: string,
    preciounitario: number,
    preciounitariomoneda: string,
    fechaentrega: string,
    precionet: number,
    preciocash: number,
    preciogross: number,
    tipoiva: string,
    basecantidad: number,
    planta: string,
    posicionsolicitud: number,
    provinciaidentrega: string,
    empid: string,
    destino: string,
    servicio: string,
  }[];
}

@Injectable()
export class OrdenConsultaService extends LegacyBaseService<OrdenConsultaInput, OrdenConsultaOutput> {

  /*
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
  */
  getConfigResponse(): LegacyConfigResponse {
    return {
      node0: 'n:WS_EBUY_TESTResponseElement',
      relashionship: [
        // HEADER DE OC
        {
          propname: 'provinciaid',
          xmlpropname: 'n:PROV_ID'
        },{
          propname: 'nrooc',
          xmlpropname: 'n:NUM_DOC'
        },{
          propname: 'userid',
          xmlpropname: 'n:USER_ID'
        },{
          propname: 'planta',
          xmlpropname: 'n:PLANTA'
        },{
          propname: 'fechacreacion',
          xmlpropname: 'n:F_CREACION',
          type: 'date'
        },{
          propname: 'fechamodificacion',
          xmlpropname: 'n:RE_MODIFICACION',
          type: 'date'
        },{
          propname: 'destino',
          xmlpropname: 'n:DESTINY_CODE'
        },{
          propname: 'moneda',
          xmlpropname: 'n:CURRENCY'
        },{
          propname: 'condicionpago',
          xmlpropname: 'n:PAY_CONDITION'
        },{
          propname: 'estado',
          xmlpropname: 'n:ESTADO'
        },{
          propname: 'tipooc',
          xmlpropname: 'n:TIPO_OC'
        },{
          propname: 'tipodoc',
          xmlpropname: 'n:TIPO_DOC'
        },{
          propname: 'empid',
          xmlpropname: 'n:EMPID'
        },
        
        // DETALLE OC        
        {
          propname: 'detalle',
          xmlpropname: 'n:TI_PEDIDOSP',
          childrens: [
            {
              propname: 'provinciaid',
              xmlpropname: 'n:PROV_ID'
            },{
              propname: 'nrooc',
              xmlpropname: 'n:NUM_DOC'
            },{
              propname: 'posicion',
              xmlpropname: 'n:POSICION',
              type: 'number'
            },{
              propname: 'entrega',
              xmlpropname: 'n:ENTREGA'
            },{
              propname: 'materialid',
              xmlpropname: 'n:MATERIAL'
            },{
              propname: 'materialnombre',
              xmlpropname: 'n:DESC_MATERIAL',
            },{
              propname: 'cantidad',
              xmlpropname: 'n:QUANTITY',
              type: 'number'
            },{
              propname: 'cantidadunidad',
              xmlpropname: 'n:QUANTITY_UNIT'
            },{
              propname: 'preciounitario',
              xmlpropname: 'n:PRICE',
              type: 'number'
            },{
              propname: 'preciounitariomoneda',
              xmlpropname: 'n:PRICE_UNIT'
            },{
              propname: 'fechaentrega',
              xmlpropname: 'n:DELIVERY_DATE',
              type: 'date'
            },{
              propname: 'precionet',
              xmlpropname: 'n:NET_VALUE',
              type: 'number'
            },{
              propname: 'preciocash',
              xmlpropname: 'n:CASH_VALUE',
              type: 'number'
            },{
              propname: 'preciogross',
              xmlpropname: 'n:GROSS_VALUE',
              type: 'number'
            },{
              propname: 'tipoiva',
              xmlpropname: 'n:IVA',
            },{
              propname: 'basecantidad',
              xmlpropname: 'n:CANT_BASE',
              type: 'number'
            },{
              propname: 'planta',
              xmlpropname: 'n:PLANTA',
            },{
              propname: 'posicionsolicitud',
              xmlpropname: 'n:POS_SOLICITUD',
              type: 'number'
            },{
              propname: 'provinciaidentrega',
              xmlpropname: 'n:PROVINCIA_ENTREGA'
            },{
              propname: 'empid',
              xmlpropname: 'n:EMPID'
            },{
              propname: 'destino',
              xmlpropname: 'n:DESTINO'
            },{
              propname: 'servicio',
              xmlpropname: 'n:SERVICIO'
            },
          ]
        },

      ],
      node: 'n:WS_EBUY_TESTResponse',
    }
  }

  getName(): LegacyType {
    return LegacyType.OrdenConsulta;
  }

  getBody(params?: OrdenConsultaInput): string {
    // como ejemplo El campo Lifnr seria 0000300435 con los "0" adelante y sociedad AR11
    return `
    <wsdl:WS_EBUY_TESTRequest>
      <wsdl:WS_EBUY_TESTRequestElement>
        <wsdl:GRUPO>${toString(params?.grupo)}</wsdl:GRUPO>
        <wsdl:LIFNR>${toString(params?.proveedor)}</wsdl:LIFNR>
        <wsdl:PEDIDO>${toString(params?.pedido)}</wsdl:PEDIDO>
        <wsdl:SOCIEDAD>${params?.sociedad || "AR11"}</wsdl:SOCIEDAD>
      </wsdl:WS_EBUY_TESTRequestElement>
    </wsdl:WS_EBUY_TESTRequest>
    `
  }

}
