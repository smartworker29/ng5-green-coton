import { AccountService } from '../services/account.service';
import { AlertsService, Alert } from '../ui/alerts.service';
import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { Design } from './design';
import { DesignsService } from './designs.service';
import { DialogService, DialogRef } from '../ui/dialog.service';

@Component({
  selector: 'app-design-save',
  styles: [`
    #save-message {
      float: left;
      display: none;
      margin-top: 10px;
    }
    #overwrite {
      margin-left: 15px;
    }
  `],
  template: `
    <button class="col btn btn-sm btn-secondary" (click)="openSave()">Save</button>

    <ng-template #savePopup let-c="close" let-d="dismiss">
      <div class="modal-header">
        <h4 class="modal-title">Save Design</h4>
        <button type="button" class="close" aria-label="Close" (click)="d('Cross click')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div *ngIf="!isLoggedIn()" class="modal-body" style="text-align:center">
        <app-account (accountEvent)="accountEventsHandler($event)"></app-account>
      </div>
      <div *ngIf="isLoggedIn()" class="modal-body">
        <div class="form-group">
          <label class="control-label">Name</label>
          <input class='form-control' type="text" [(ngModel)]="currentDesign.name" (ngModelChange)="onChanges('name', $event)" />
        </div>
        <div>
          <label><input type='checkbox' [(ngModel)]="promotionalEmails" /> Send me coupons, sale info and design tips!</label>
        </div>
        <div>
          <button id="overwrite" *ngIf="hasServerSave()" type="button" [disabled]="clicked" (click)="onSave(true); clicked=true;" class="pull-right btn btn-sm btn-secondary">
            Overwrite Existing
          </button>
          <button type="button" [disabled]="clicked" (click)="onSave(false); clicked=true;" class="pull-right btn btn-sm btn-secondary">Save as new</button>
        </div>
      </div>
    </ng-template>
  `,
})
export class SaveComponent {
  @Input() currentDesign: Design;
  private saveDialog: DialogRef;
  @ViewChild('savePopup') savePopup: TemplateRef<any>;
  private promotionalEmails: boolean;
  private clicked = false;

  constructor(
    private designsService: DesignsService,
    private dialogService: DialogService,
    private alertsService: AlertsService,
    private accountService: AccountService,
  ) {
    this.promotionalEmails = true;
  }

  onChanges(property: string, value: any) {
    switch (property) {
      case 'name':
        this.currentDesign.name = value;
        break;
    }
  }

  openSave() {
    this.saveDialog = this.dialogService.open(this.savePopup, { name: 'design-save', size: 'lg' });
  }

  onSave(overwrite = false) {
    console.log(this.promotionalEmails);
    if (!overwrite) {
      this.currentDesign.resetId();
    }
    let self = this;
    this.designsService.saveDesign(this.currentDesign).subscribe((id) => {
      const alert = this.alertsService.broadcast(new Alert({content: 'Design saved successfully!', dismissIn: 3}));

      if (this.promotionalEmails) {
        this.accountService.subscribeToPromotionalEmails().subscribe((res) => {
        });
      }

      this.dialogService.close(this.saveDialog);
      self.clicked = false;
    },
    (error) => {
      self.clicked = false;
    });
  }

  isLoggedIn() {
    if (this.accountService.account['id']) {
      return true;
    } else {
      return false;
    }
  }

  hasServerSave() {
    return this.currentDesign.hasServerSave();
  }

  accountEventsHandler(event) {
    switch (event) {
      case 'close':
        this.dialogService.close(this.saveDialog);
        break;
    }
  }
}

