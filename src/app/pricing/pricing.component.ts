import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Design } from '../designs/design';
import { DesignsService } from '../designs/designs.service';
import { DesignsEvent } from '../designs/designs-event';
import { DialogService } from '../ui/dialog.service';
import { PricingService, PricingLineItem } from '../pricing/pricing.service';
import { SizesComponent } from './sizes.component';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-pricing',
  styles: [`
    .price {
      font-size: 26px;
      line-height: 26px;
      vertical-align: top;
      margin: 0 0 5px;
    }
    .line-item-table { margin:0; font-weight: normal;}
    .line-item-table td { padding: 5px;}
    .line-item-table td:last-child {
      text-align: right;
      font-weight: bold;
    }
  `],
  template: `
    <p class='price'>
      <ng-template [ngIf]="!zeroPrice()">
        {{price}}
        <button (click)="open()" class="btn btn-link small">(Details)</button>
      </ng-template>
      <ng-template [ngIf]="zeroPrice()">
        <button (click)="addQuantities()" class="btn btn-link small">(Add Quantities to see pricing.)</button>
      </ng-template>
    </p>
    <ng-template #content let-c="close" let-d="dismiss" class="pricing-modal">
      <div class="modal-header">
        <h4 class="modal-title">Pricing</h4>
        <button type="button" class="close" aria-label="Close" (click)="d('Cross click')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <table class="table table-striped line-item-table">
          <tbody>
            <ng-template ngFor let-lineItem [ngForOf]="pricingLineItems">
              <tr>
                <td>{{lineItem.label}}:</td>
                <td>{{lineItem.value}}</td>
              </tr>
            </ng-template>
          </tbody>
        </table>
      </div>
    </ng-template>
    <app-sizes></app-sizes>
  `,
})
export class PricingComponent implements OnInit, OnDestroy {
  private currentDesign: Design;
  private eventsSubscription: Subscription;
  private subscription: Subscription;
  public pricingLineItems: PricingLineItem[] = [];
  public price = '';
  private pricingSubscription: Subscription;
  @ViewChild(SizesComponent) sizesComponent: SizesComponent;
  @ViewChild('content') pricingPopup: TemplateRef<any>;

  constructor(private designsService: DesignsService, private dialogService: DialogService, private pricingService: PricingService) {}

  ngOnInit() {
    this.subscription = this.designsService.selectedDesign.subscribe((d) => {
      this.currentDesign = d;
    });

    this.pricingSubscription = this.pricingService.lineItems.subscribe((lineItems) => {
      this.pricingLineItems = lineItems;
      if (lineItems) {
        const total = lineItems.find((li) => li.label === 'Total');
        if (total) {
          this.price = total.value;
        }
      }
    });

    this.eventsSubscription = this.designsService.events.subscribe((designEvent: DesignsEvent) => {
      switch (designEvent.type) {
        case 'LOAD_DESIGN':
        case 'UPDATE_DESIGN':
        case 'CHANGE_DESIGN_PRODUCT':
        case 'CHANGE_PRODUCT_COLOR':
          this.pricingService.getPricing(designEvent.payload);
          break;

        case 'ADD_ELEMENT':
        // TODO: This event probably shouldn't exist.. the payload needs to have this flag
        case 'UPDATE_ELEMENT_LIKELY_PRICE_CHANGE':
        case 'REMOVE_ELEMENT':
          this.pricingService.getPricing(this.currentDesign);
          break;
      }
    });
  }

  zeroPrice() {
    return this.price === '$0.00';
  }

  open() {
    this.dialogService.open(this.pricingPopup, { name: 'pricing', block: 1 });
  }

  addQuantities() {
    this.sizesComponent.open();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.pricingSubscription.unsubscribe();
    this.eventsSubscription.unsubscribe();
  }
}
