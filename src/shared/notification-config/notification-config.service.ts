import { Injectable } from '@nestjs/common';
import { BodyRequestNotification } from '@proguidemc/notification-module/lib/notification.interfaces';
import { NotificationService } from '@proguidemc/notification-module/lib/notification.service';
import { UserConfigService } from '../userconfig/userconfig.service';
import { replaceAll } from "@proguidemc/notification-module/lib/notification.functions";
import { errorFn, toArray, toString } from '../utils/utils';

@Injectable()
export class NotificationConfigService {
  constructor(
    public notificationService: NotificationService, 
    private userConfigService: UserConfigService,
  ) {}

  public async getUserToken(email: string):Promise<string> {
    if (!email || !this.userConfigService.tokenEnabled()) return "";
        
    const user = await this.userConfigService.findUsers({email});
    if (toArray(user).length == 0 || !user[0].username) {
      return "";
    }

    const username = user[0].username;

    const token = await this.userConfigService.getUserToken(username, email).catch(errorFn);
    if (!token) {
      console.error("getUserToken", "no se pudo generar token para el email " + email);
    }

    return toString(token);
  }
  
  send(body: BodyRequestNotification, log?: boolean): Promise<void> {
    return new Promise(async resolve => {
      if (this.userConfigService.tokenEnabled() && Array.isArray(body?.info) && toArray(body?.target).length > 0) {        
        const item = body.info.find(i => i.name == 'link');
        const defaultLink: string = (toString(item?.value).toString()).replace('[URL]', this.userConfigService.webUrl());
        
        if (body.rawHTML) {
          body.rawHTML = replaceAll(body.rawHTML, '[URL]', this.userConfigService.webUrl());
        }

        if ((item && defaultLink) || (body.rawHTML?.includes('[TOKEN]'))) {
          for (const target of body.target) {
            let value = defaultLink;
            if (value.includes("[TOKEN]")) {
              value = value.replace('[TOKEN]', await this.getUserToken(target?.email));
            }
            if (item) item.value = value;
            log && console.warn("notificationService.send", body);
            await this.notificationService.send(body);
          }
        } else {
          log && console.warn("notificationService.send", body);
          await this.notificationService.send(body);
        }
      }

      resolve();
    })
  }
  
}
