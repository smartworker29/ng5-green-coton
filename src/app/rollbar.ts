import * as Rollbar from 'rollbar';
import {
  Injectable,
  Inject,
  InjectionToken,
  ErrorHandler
} from '@angular/core';

const rollbarConfig:Rollbar.Configuration = {
  accessToken: '0cbfe45d34424b23a282ec02f417bea7',
  captureUncaught: true,
  captureUnhandledRejections: true,
  verbose: true
};

export const RollbarService = new InjectionToken<Rollbar>('rollbar');

@Injectable()
export class RollbarErrorHandler implements ErrorHandler {
  constructor(@Inject(RollbarService) private rollbar: Rollbar) {}

  handleError(err:any) : void {
    this.rollbar.error(err.originalError || err);
  }
}

export function rollbarFactory() {
  return new Rollbar(rollbarConfig);
}