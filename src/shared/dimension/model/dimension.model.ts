import  { BaseModel } from "@proguidemc/http-module";

export class Dimension extends BaseModel {
    name!: string;
    enabled!: boolean;
    type!: string;
}