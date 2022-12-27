import  { BaseModel } from "@proguidemc/http-module";

export class Centro extends BaseModel {
    name!: string;
    codigosap!: string;
    enabled!: boolean;
    sociedadid!: string;
}