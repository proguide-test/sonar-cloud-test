import  { BaseModel } from "@proguidemc/http-module";

export class Config extends BaseModel {
    name!: string;
    value!: any;
}