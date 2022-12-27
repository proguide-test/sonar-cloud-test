import  { BaseModel } from "@proguidemc/http-module";

export class Material extends BaseModel {
    name!: string;
    enabled!: boolean;
}