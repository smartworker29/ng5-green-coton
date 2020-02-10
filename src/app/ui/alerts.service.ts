import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/from';
import * as _ from 'lodash';
const uuidV1 = require('uuid/v1');

@Injectable()
export class AlertsService {
  alerts: BehaviorSubject<Array<Alert>>;
  private _alerts: Alert[] = [];

  constructor() {
    this.alerts = new BehaviorSubject(this._alerts);
  }

  broadcast(alert: Alert): Alert {
    alert.id = uuidV1();
    this._alerts.push(alert);
    this.alerts.next(this._alerts);

    if (alert.dismissIn > 0) {
      const self = this;
      setTimeout(function() {
        self.close(alert);
      }, alert.dismissIn * 1000);
    }

    return alert;
  }

  close(alert: Alert) {
    _.remove(this._alerts, (a) => { return a.id === alert.id; });
    this.alerts.next(this._alerts);
  }
}

export class Alert {
  id: string;
  type = 'info';
  dismissable = false;
  content: string;
  dismissIn = 0;
  hiddenOnSmall = false;

  constructor(options = {}) {
    Object.assign(this, options);
  }
}
