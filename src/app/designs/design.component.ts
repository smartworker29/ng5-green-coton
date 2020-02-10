import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AlertsService, Alert } from '../ui/alerts.service';
import { Color as ProductColor } from '../products/color';
import { Color } from '../colors/color';
import { ColorsService } from '../colors/colors.service';
import { Design } from './design';
import { DesignsService } from './designs.service';
import { DesignsEvent } from './designs-event';
import { DialogService } from '../ui/dialog.service';
import { FontPickerService } from '../ui/font-picker.service';
import { GlobalService } from '../services/global.service';
import { ImagesService } from '../images/images.service';
import { ProductsComponent } from '../products/products.component';
import { ProductsService } from '../products/products.service';
import { SizesComponent } from '../pricing/sizes.component';
import { Subscription } from 'rxjs/Subscription';
import { SvgService } from '../services/svg.service';

@Component({
  selector: 'app-design',
  styleUrls: ['./design.component.scss'],
  templateUrl: './design.component.html',
})
export class DesignComponent implements OnInit, OnDestroy {
  public currentDesign: Design;
  private designSubscription: Subscription;
  private productsSubscription: Subscription;
  private color: Color;
  private availableColors: Color[];
  @Input() designId: string;
  @Input() cartItemId: string;
  @Input() exportMode: string;
  @Input() spoofSession: string;
  @Input() orderId: string;
  @Input() itemId: string;
  @Input() sharedDesignId: string;
  @Input() productId: string;
  @Input() colorId: string;
  @ViewChild(ProductsComponent) productsComponent: ProductsComponent;
  @ViewChild(SizesComponent) sizesComponent: SizesComponent;
  @ViewChild('quickBarContent') quickBarContent: ElementRef;

  constructor(
    private alertsService: AlertsService,
    private dialogService: DialogService,
    private svgService: SvgService,
    private designsService: DesignsService,
    private productsService: ProductsService,
    private colorsService: ColorsService,
    private fontPickerService: FontPickerService,
    private globalService: GlobalService,
    private imagesService: ImagesService,
  ) {}

  ngOnInit() {
    this.designSubscription = this.designsService.events.subscribe((designEvent: DesignsEvent) => {
      switch (designEvent.type) {
        case 'CHANGE_DESIGN_PRODUCT': {
          const d = designEvent.payload;
          this.currentDesign = d;
          this.globalService.currentDesign = this.currentDesign;
          this.availableColors = d.product.availableColors().map((c) => this.colorFromProductColor(c));
          this.color = this.colorFromProductColor(d.productColor);
          this.onSelectColor(this.color);
          break;
        }
        case 'LOAD_DESIGN': {
          this.svgService.draw().clear();
          const d = designEvent.payload;
          this.currentDesign = d;
          this.globalService.currentDesign = this.currentDesign;
          this.fontPickerService.loadFonts(this.currentDesign.fonts.map((f) => f.family));

          let product = this.currentDesign.productId;

          if (this.productId && (this.cartItemId || this.designId)) {
            product = this.productId;
            this.productId = null;
          }

          this.productsService.getProduct(product).subscribe((p) => {
            this.designsService.updateDesignProduct(this.currentDesign, p).subscribe(() => {
              if (this.colorId) {
                const color = this.currentDesign.product.availableColors().find(item => item.id.toString() === this.colorId);
                this.onSelectColor(this.colorFromProductColor(color));
                this.colorId = null; // unset because we don't want to change the color of designs loaded after the initial load
              }
            });
            this.designsService.selectedDesign.next(this.currentDesign)
          });

          break;
        }
      }

      if (this.currentDesign) {
        if (designEvent.type === 'LOAD_DESIGN') {
          this.currentDesign.hasUnsavedChanges = false;
        } else {
          this.currentDesign.hasUnsavedChanges = true;
        }
      }
    });

    if (this.orderId && this.itemId) {
      this.designsService.selectOrderItem(this.orderId, this.itemId);

    } else if (this.cartItemId) {
      this.designsService.selectCartItem(this.cartItemId);

    } else if (this.designId) {
      this.designsService.selectDesign(this.designId);

    } else if (this.sharedDesignId) {
      this.designsService.loadSharedDesign(this.sharedDesignId);

    } else {
      // Create new, default design
      const design = new Design(this.svgService.draw(), this.designsService, this.colorsService, this.productsService, this.imagesService);

      if (this.productId) {
        design.productId = this.productId;
      } else {
        design.productId = this.productsService.defaultProductId;
      }

      this.designsService.events.next(new DesignsEvent('LOAD_DESIGN', design));
    }
  }

  onChanges(property: string, value: any) {
    switch (property) {
      case 'color':
        this.color = value;
        const alert = this.alertsService.broadcast(new Alert({content: 'Updating color...'}));
        this.designsService.updateProductColor(this.currentDesign, this.productColorFromColor(value)).subscribe(() => {
          this.alertsService.close(alert);
        });
        break;
    }
  }

  onSelectProduct(product) {
    const alert = this.alertsService.broadcast(new Alert({content: 'Updating product...'}));
    this.color = this.colorFromProductColor(product.availableColors()[0]);
    this.designsService.updateDesignProduct(this.currentDesign, product).subscribe((d) => {
      this.alertsService.close(alert);
      this.productsComponent.close();
    });
  }

  onCancelBrowsingProducts() {
    this.productsComponent.close();
  }

  onSelectColor(color: Color) {
    this.onChanges('color', color);
    this.currentDesign.elements.forEach((e) => {
      e.colors().forEach((c) => {
        if (c.id === 'GARMENT_COLOR') {
          c.rgb = this.currentDesign.productColor.swatch();
          e.render().subscribe();
        }
      });
    });
  }

  openProducts(event: Event) {
    this.productsComponent.open();
    event.preventDefault();
  }

  openQuantities(event: Event) {
    this.sizesComponent.open();
    event.preventDefault();
  }

  showQuickBar() {
    this.quickBarContent.nativeElement.classList.add('show');
  }

  hideQuickBar() {
    this.quickBarContent.nativeElement.classList.remove('show');
  }

  private colorFromProductColor(productColor: ProductColor): Color {
    const color = new Color();
    color.id = productColor.id.toString();
    color.name = productColor.name;
    color.rgb = productColor.swatch();
    color.display = productColor.display;
    return color;
  }

  private productColorFromColor(color: Color): ProductColor {
    return this.currentDesign.product.availableColors().find(item => item.id.toString() === color.id );
  }

  ngOnDestroy() {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
    if (this.designSubscription) {
      this.designSubscription.unsubscribe();
    }
  }
}
