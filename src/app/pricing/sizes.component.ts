import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Design } from '../designs/design';
import { DesignsService } from '../designs/designs.service';
import { DesignsEvent } from '../designs/designs-event';
import { DialogService } from '../ui/dialog.service';
import { Size } from '../designs/size';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-sizes',
  styleUrls: ['./sizes.component.scss'],
  templateUrl: './sizes.component.html',
})
export class SizesComponent implements OnInit, OnDestroy {
  private currentDesign: Design;
  private sizes: Size[] = [];
  private subscription: Subscription;
  private eventsSubscription: Subscription;
  @ViewChild('content') sizesPopup: TemplateRef<any>;

  constructor(private designsService: DesignsService, private dialogService: DialogService) {}

  ngOnInit() {
    this.subscription = this.designsService.selectedDesign.subscribe((d) => {
      this.currentDesign = d;
      this.updateSizesFromDesign(d);
    });

    this.eventsSubscription = this.designsService.events.subscribe((designEvent: DesignsEvent) => {
      switch (designEvent.type) {
        case 'LOAD_DESIGN':
        case 'CHANGE_PRODUCT_COLOR':
          this.updateSizesFromDesign(designEvent.payload);
          break;
      }
    });
  }

  get adultSizes(): Size[] {
    return this.sizes.filter((s) => !s.youth())
  }

  get youthSizes(): Size[] {
    return this.sizes.filter((s) => s.youth() )
  }

  open() {
    this.dialogService.open(this.sizesPopup, { name: 'sizes' });
  }

  onUpdateSize(size: Size, value: any) {
    const qty = parseInt(value, 10);
    if (qty < 0 || !Number.isInteger(qty)) {
      size.quantity = 0;
      return;
    }
    this.updateSize(size, qty);
  }

  updateSize(size: Size, qty: number) {
    const updatedSize = this.sizes.find((s) => s.size === size.size);
    updatedSize.quantity = qty;
    this.updateSizes();
  }

  updateSizes() {
    this.designsService.updateDesignSizes(this.currentDesign, this.sizes);
  }

  private updateSizesFromDesign(design: Design) {
    if (design.productColor) {
      this.sizes = design.productColor.sizes.map((size) => { return new Size(size, design.quantityForSize(size)); });
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
    }
  }
}
