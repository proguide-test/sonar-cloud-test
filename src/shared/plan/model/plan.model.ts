import  { BaseModel } from "@proguidemc/http-module";

export class Plan extends BaseModel {
    name!: string;
    enabled!: boolean;
    description?: string;
}