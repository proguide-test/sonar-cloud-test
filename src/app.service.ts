import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { configurationGet, DBName, defaultToken, FlexService, JwtPayload } from '@proguidemc/http-module';
import { Configuration } from './shared/configuration/configuration.enum';
import { UserConfigService } from './shared/userconfig/userconfig.service';
import { errorFn } from './shared/utils/utils';

export type AuthType = 'region' | 'supplier' | 'oc' | 'compras';
@Injectable()   
export class AppService extends FlexService {
  constructor (
    protected httpService: HttpService,
    protected userConfigService: UserConfigService,
  ) {
    super(AppService.name, httpService);
    userConfigService.manageKeyToken();
  }

  login(info: LoginParams): Promise<any> {
    return new Promise(async (resolve, _reject) => {      
      resolve(info);
    });
  }

  getHello(): string {
    return 'Shopping API. Version: ' + configurationGet("BRANCHNAME");
  }

  private async getInfoLogin(userId?: string) {
    const UM_HOST_PORT = configurationGet(Configuration.UM_HOST_PORT);
    if (!userId || !UM_HOST_PORT || UM_HOST_PORT.length < 5) return undefined;
    
    const resp = await this.httpget(
        `${UM_HOST_PORT}/user/info-login/${userId}`,
        {
            headers: {
                authorization: 'bearer ' + defaultToken()
            }                
        }
    ).catch(errorFn);
    return resp?.user;
  }

  private async getInfoDbUser(tablename: 'companies' | 'applications' | 'userroles', filter: any = {}, company?: any, app?: any) {
    switch (tablename) {
      case "companies": 
        return this.findOneFlex({dbname: 'UserManager', tablename}, filter, [{
          "_id" : "600f1034fd0822004ef49aba",
          "id" : "600f1034fd0822004ef49aba",
          "createdAt" : "2020-10-21T01:10:32.587Z",
          "updatedAt" : "2020-10-21T01:10:32.588Z",
          "name" : "Quilmes",
          "pwdPolicy" : {
              "_id" : "601801763db4900043735565",
              "pwdMinLength" : 4,
              "pwdMaxLength" : 30,
              "userMinLength" : 4,
              "userMaxLength" : 30
          },
          "domain" : "proguidemc"
        }]);  
      case "applications": 
        return !company ? undefined : this.findOneFlex({dbname: 'UserManager', tablename}, filter, [{
          "_id" : "6203c15ef680d8860f5d1d13",
          "id" : "6203c15ef680d8860f5d1d13",
          "name" : "modulocompras",
          "url" : "{app}/auth",
          "title" : "Test",
          "permission" : ""
        }]);  
      case "userroles": 
        return !company || !app ? undefined : this.findOneFlex({dbname: 'UserManager', tablename}, filter, [{
          "_id" : "61264526c293ff0044e87f2a",
          "permissions" : [ 
              {
                  "element" : {
                      "name" : "Todos los Elementos"
                  },
                  "componentId" : "6233a47d5c25dd7854f1fab6",
                  "permission" : true
              }
          ],
          "role" : "Compras",
          "appId" : "6203c15ef680d8860f5d1d13",
          "id" : "61264526c293ff0044e87f2a"
        }]);  
    }
  }

  async validateCustomUser(type: AuthType, id: string, keytoken: string) {
    return new Promise(async(resolve, reject) => {
      
      const info = await this.userConfigService.getKeyToken(keytoken);
      if (!info) return reject({message: 'Invalid Token'});
      
      this.validateUser(type, id, info.token, info.user)
      .then(resp => {
        resolve(resp)
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  async validateUser(type: AuthType, id: string, bearerToken: string, userInfo?: JwtPayload) {
    return new Promise(async(resolve, reject) => {
        try {
            /*
                Estructura del Token:
                    Si el usuario es un invitado:
                        userId = guest
                        userName = mail del encargado de TO
                    Si no es guest:
                        userId = id de tabla usuario de mongo
                        userName = username del userId
            */
            const userId = userInfo?.userId;
            const userName = userInfo?.username;            
                
            let user = null;

            if (userId != 'guest') {
                user = await this.getInfoLogin(userId);                
                if (!user) return reject({message: 'Invalid Token'});
            } else {
                // Cargar info de usuario "guest"
                const company = await this.getInfoDbUser('companies');
                const app = await this.getInfoDbUser('applications', {name: 'modulocompras'}, company);
                const rol = await this.getInfoDbUser('userroles', {appId: app?.id}, company, app);
                if (!rol) return reject({message: 'Invalid Rol'});
            
                let info: {
                    firstName: string,
                    lastName: string,
                } | undefined;
            
                if (type == "region") {
                    const item = await this.findOneFlex({dbname: DBName.ShoppingManager, tablename: 'region'}, {id});
                    const userRegion = item?.users?.find((i: any) => i.email == userName);
                    if (userRegion) {
                        info = {
                            firstName: userRegion.firstName,
                            lastName: userRegion.lastName,
                        }
                    }
                } else if (type == "supplier") {
                    const item = await this.findByIdFlex({dbname: DBName.ShoppingManager, tablename: 'proveedor'}, id);
                    if (item?.emailc == userName) {
                        info = {
                            firstName: 'Proveedor', 
                            lastName: item.name,
                        }
                    }
                }

                if (!info) return reject({message: 'Invalid ID'});
            
                user = {
                    id: 'guest-'+userName,
                    username: 'guest',
                    firstName: info.firstName,
                    lastName: info.lastName,
                    fullName: info.firstName + ' ' + info.lastName,
                    nick: 'guest',
                    email: userName,
                    company,
                    userRoles: [rol],
                    allRoles: [rol],
                    applications: [],
                    groups: [{
                        id: 'group-'+userName,
                        name: userName,
                        company,                        
                    }],
                    specialGroups: [],                    
                };
            }

            resolve({
                timeout: 60 * 60, // la sesion sera valida por una hora
                token: bearerToken.replace("bearer ", "").replace("Bearer ", ""),
                user
            });
        } catch(error: any) {
            reject({message: error?.message || "Invalid Request"});
        }
    })}
}


export interface LoginParams {
  username: string;
  password: string;
}
