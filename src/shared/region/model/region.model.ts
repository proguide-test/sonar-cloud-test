import  { BaseModel } from "@proguidemc/http-module";
import { UserInfo } from "../../userconfig/model/userconfig.model";

export class Region extends BaseModel {
    name!: string;
    enabled!: boolean;
    users?: UserInfo[];
    abreviatura?: string;
}