import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PricingComponent } from './pricing.component';
import { SizesComponent } from './sizes.component';
import { UiModule } from '../ui/ui.module';

@NgModule({
  imports: [ CommonModule, NgbModule, UiModule ],
  declarations: [
    PricingComponent,
    SizesComponent,
  ],
  exports: [
    PricingComponent,
    SizesComponent,
  ],
})
export class PricingModule { }
