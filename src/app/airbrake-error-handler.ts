import { Design } from './designs/design';
import { environment } from '../environments/environment';
import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { GlobalService } from './services/global.service';
import * as airbrakeJs from 'airbrake-js';

@Injectable()
export class AirbrakeErrorHandler implements ErrorHandler {

  private airbrake: any;
  private selectedDesign: Design;

  constructor(private injector: Injector, private globalService: GlobalService) {
    this.airbrake = new airbrakeJs({
      projectId: '59c906e3776562779ade0c00',
      projectKey: '107448d3bc5b469cc434de3788ce7b17',
      host: '//errbit.hcents.com',
      reporter: 'xhr',
      port: 80
    });
  }

  handleError(error: any): void {
    // TODO: add more data - like session id, maybe parameters from the root component
    if (environment.reportErrors) {
      this.airbrake.notify({
        error: error,
        context: { environment: environment.production ? 'production' : 'development' },
        session: {
          design: this.selectedDesign ? this.selectedDesign.toJson() : null,
          designId: this.selectedDesign ? this.selectedDesign.id : null,
          globalVariables: this.getGlobalVars(),
          cookies: this.getCookies(),
        },
      });
    }

    throw error;
  }

  private getGlobalVars(): any {
    return {
      designId: this.globalService.designId,
      design: this.globalService.currentDesign,
      cartItemId: this.globalService.cartItemId,
      exportMode: this.globalService.exportMode,
      spoofSession: this.globalService.spoofSession,
      orderId: this.globalService.orderId,
      itemId: this.globalService.itemId,
      sharedDesignId: this.globalService.sharedDesignId,
    };
  }

  private getCookies(): any {
    if (!window.document) {
      return {};
    }

    const cookies: {} = {};
    const document: any = window.document;

    if (document.cookie && document.cookie !== '') {
      const split: Array<string> = document.cookie.split(';');

      for (let i = 0; i < split.length; i += 1) {
        const currentCookie: Array<string> = split[i].split('=');

        currentCookie[0] = currentCookie[0].replace(/^ /, '');
        cookies[decodeURIComponent(currentCookie[0])] = decodeURIComponent(currentCookie[1]);
      }
    }

    return cookies;
  }
}
