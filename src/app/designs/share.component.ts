import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { Design } from './design';
import { DesignsService } from './designs.service';
import { DialogService } from '../ui/dialog.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-design-share',
  styles: [`
  `],
  template: `
    <button class="col btn btn-sm btn-secondary" (click)="openShare()">Share</button>

    <ng-template #sharePopup let-c="close" let-d="dismiss">
      <div class="modal-header">
        <h4 class="modal-title">Share Design</h4>
        <button type="button" class="close" aria-label="Close" (click)="d('Cross click')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <p *ngIf="!shouldShowShareLinks()">
          Saving design for sharing...
        </p>
        <ng-template [ngIf]="shouldShowShareLinks()">
          Share via:
          <div class="row">
            <button class="col btn btn-link" (click)="onShareViaEmail()">
              <i class="fa fa-envelope" aria-hidden="true"></i>
              Email
            </button>
            <button class="col btn btn-link" (click)="onShareViaFacebook()">
              <i class="fa fa-facebook" aria-hidden="true"></i>
              Facebook
            </button>
            <button class="col btn btn-link" (click)="onShareViaTwitter()">
              <i class="fa fa-twitter" aria-hidden="true"></i>
              Twitter
            </button>
          </div>
        </ng-template>
      </div>
    </ng-template>
  `,
})
export class ShareComponent {
  @Input() currentDesign: Design;
  @Input() sharedDesignId: string;
  @ViewChild('sharePopup') sharePopup: TemplateRef<any>;

  constructor(
    private designsService: DesignsService,
    private dialogService: DialogService,
  ) {}

  onChanges(property: string, value: any) {
    switch (property) {
      case 'name':
        this.currentDesign.name = value;
        break;
    }
  }

  openShare() {
    if (!this.shouldShowShareLinks()) {
      this.designsService.shareDesign(this.currentDesign).subscribe((id) => {
        this.sharedDesignId = id;
      });
    }
    this.dialogService.open(this.sharePopup, { name: 'design-share', class: 'lg' });
  }

  onShare() {
    this.designsService.saveDesign(this.currentDesign).subscribe();
  }

  shouldShowShareLinks() {
    return this.sharedDesignId && !this.currentDesign.hasUnsavedChanges;
  }

  onShareViaEmail() {
    window.open(environment.siteUrl + '/share/redirect?method=email&shareID=' + this.sharedDesignId);
  }

  onShareViaFacebook() {
    window.open(environment.siteUrl + '/share/redirect?method=facebook&shareID=' + this.sharedDesignId);
  }

  onShareViaTwitter() {
    window.open(environment.siteUrl + '/share/redirect?method=twitter&shareID=' + this.sharedDesignId);
  }
}

