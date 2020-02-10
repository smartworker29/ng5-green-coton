import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertsService, Alert } from './alerts.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-ui-alerts',
  styles: [`
    .alerts-container {
      position: fixed;
      z-index: 1300;
      top: 0;
      width: 100%;
      text-align: center;
    }
  `],
  template: `
    <div class="alerts-container">
      <p *ngFor="let alert of alerts$ | async" class="ui-alert">
        <ngb-alert
          [class]="alert.hiddenOnSmall ? 'd-none d-lg-block' : ''"
          [type]="alert.type"
          [dismissible]="alert.dismissable"
          (close)="onClose(alert, $event)"
          >
          {{alert.content}}
        </ngb-alert>
      </p>
    </div>
  `,
})

export class AlertsComponent implements OnInit, OnDestroy {
  alerts$: BehaviorSubject<Array<Alert>>;

  constructor(private alertsService: AlertsService) { }

  ngOnInit() {
    this.alerts$ = this.alertsService.alerts;
  }

  ngOnDestroy() {
  }

  onClose(alert, event) {
    this.alertsService.close(alert);
  }
}
