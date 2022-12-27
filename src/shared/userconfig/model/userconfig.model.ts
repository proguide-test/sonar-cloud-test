import  { BaseModel } from "@proguidemc/http-module";

export class UserConfig extends BaseModel {
    userid!: string;
    origenesid!: string[];
    destinosid!: string[];
}

export interface UserInfo {
    id: string, 
    username: string, 
    email: string,
    groups?: string[], 
    groupsNames?: {
        id: string, 
        name: string
    }[];
    firstName: string;
    lastName: string;
    config?: UserConfig;
}
  
export interface Tokens extends BaseModel {
    username: string, 
    email: string,
    token: string,
    expiration: string,
}