import  { BaseModel } from "@proguidemc/http-module";

export class Supervisor extends BaseModel {
    name!: string; 
    enabled!: boolean;
}