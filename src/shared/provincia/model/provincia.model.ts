import  { BaseModel } from "@proguidemc/http-module";

export class Provincia extends BaseModel {
    name!: string;
    codigo?: string;
    enabled!: boolean;
}
