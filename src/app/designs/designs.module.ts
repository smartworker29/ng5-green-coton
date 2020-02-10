import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddToCartComponent } from './add-to-cart.component';
import { DesignComponent } from './design.component';
import { DesignsComponent } from './designs.component';
import { ExportComponent } from './export.component';
import { FormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PricingModule } from '../pricing/pricing.module';
import { ProductsModule } from '../products/products.module';
import { SaveComponent } from './save.component';
import { ShareComponent } from './share.component';
import { UiModule } from '../ui/ui.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    InlineSVGModule,
    NgbModule,
    PricingModule,
    ProductsModule,
    UiModule,
  ],
  declarations: [
    AddToCartComponent,
    DesignComponent,
    DesignsComponent,
    ExportComponent,
    SaveComponent,
    ShareComponent,
  ],
  exports: [
    DesignComponent,
    DesignsComponent
  ],
})
export class DesignsModule { }
