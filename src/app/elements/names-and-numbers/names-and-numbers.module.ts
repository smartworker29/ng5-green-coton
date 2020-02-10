import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg';

import { NamesAndNumbersComponent } from './names-and-numbers.component';
import { PricingModule } from '../../pricing/pricing.module';
import { UiModule } from '../../ui/ui.module';

@NgModule({
  imports: [ CommonModule, FormsModule, InlineSVGModule, PricingModule, UiModule ],
  declarations: [
    NamesAndNumbersComponent,
  ],
  exports: [ NamesAndNumbersComponent ],
})
export class NamesAndNumbersModule { }
