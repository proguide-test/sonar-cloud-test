import  { BaseModel } from "@proguidemc/http-module";

export class Canal extends BaseModel {
    name!: string;
    enabled!: boolean;
}