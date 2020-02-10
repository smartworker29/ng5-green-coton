import { AccountService } from '../services/account.service';
import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { Design } from './design';
import { DesignsService } from './designs.service';
import { DialogService } from '../ui/dialog.service';
import { GlobalService } from '../services/global.service';

@Component({
  selector: 'app-design-add-to-cart',
  styles: [``],
  template: `
    <button class='col btn btn-sm btn-secondary' (click)="openAddToCart()">Add To Cart</button>

    <ng-template #cartPopup let-c="close" let-d="dismiss">
      <div class="modal-header">
        <h4 class="modal-title">Add To Cart</h4>
        <button type="button" class="close" aria-label="Close" (click)="d('Cross click')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div *ngIf="!isLoggedIn()" class="modal-body" style="text-align:center">
        <app-account (accountEvent)="accountEventsHandler($event)"></app-account>
      </div>
      <div *ngIf="isLoggedIn()" class="modal-body">
        <div class="form-group">
          <label class="control-label">Special Instructions</label>
          <textarea
            [ngModel]="currentDesign.specialInstructions"
            (keyup)="onChanges('specialInstructions', $event)"
            class="form-control"
          ></textarea>
        </div>
        <div *ngIf="overridePossible()">
          <button type="button" (click)="onAddToCartOverride()" style='margin-left: 20px;' class="pull-right btn btn-primary">Update Cart Item</button>
          <button type="button" (click)="onAddToCart()" class="pull-right btn btn-secondary">Add as New Cart Item</button>
        </div>
        <div *ngIf="!overridePossible()">
          <button type="button" (click)="onAddToCart()" style='margin-left: 20px;' class="pull-right btn btn-primary">Add to Cart</button>
        </div>
      </div>
    </ng-template>
  `,
})

export class AddToCartComponent {
  @Input() currentDesign: Design;
  @ViewChild('cartPopup') cartPopup: TemplateRef<any>;

  constructor(
    private designsService: DesignsService,
    private dialogService: DialogService,
    private globalService: GlobalService,
    private accountService: AccountService
  ) {}

  onChanges(property: string, value: any) {
    switch (property) {
      case 'specialInstructions':
        this.currentDesign.specialInstructions = value.target.value;
        break;
    }
  }

  isLoggedIn() {
    if (this.accountService.account['id']) {
      return true;
    } else {
      return false;
    }
  }

  openAddToCart() {
    this.dialogService.open(this.cartPopup, { name: 'design-cart', size: 'lg' });
  }

  onAddToCart() {
    this.designsService.addToCart(this.currentDesign);
  }

  onAddToCartOverride() {
    this.designsService.addToCart(this.currentDesign, this.globalService.cartItemId);
  }

  overridePossible() {
    return this.globalService.cartItemId !== null && this.globalService.productId === null;
  }
}

