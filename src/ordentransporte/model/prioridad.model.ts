import  { BaseModel } from "@proguidemc/http-module";

export interface Prioridad extends BaseModel {
    name: string;
    days: number;
    enabled: boolean;
}
