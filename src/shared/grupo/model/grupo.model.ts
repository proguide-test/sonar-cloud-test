import  { BaseModel } from "@proguidemc/http-module";

export interface Grupo extends BaseModel {
    name : string;
    enabled : boolean;
}