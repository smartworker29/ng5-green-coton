import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AlertsComponent } from './alerts.component';
import { ColorPickerComponent } from './color-picker.component';
import { ColorSwatchComponent } from './color-swatch.component';
import { FormsModule } from '@angular/forms';
import { FontPickerComponent } from './font-picker.component';
import { LoadingComponent } from './loading.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PrecisionRangeComponent } from './precision-range.component';
import { TabComponent } from './tab.component';
import { TabsComponent } from './tabs.component';
import { AccountComponent } from '../account/account.component';

@NgModule({
  imports: [ CommonModule, FormsModule, NgbModule ],
  declarations: [
    AccountComponent,
    AlertsComponent,
    ColorPickerComponent,
    ColorSwatchComponent,
    FontPickerComponent,
    LoadingComponent,
    PrecisionRangeComponent,
    TabComponent,
    TabsComponent
  ],
  exports: [
    AccountComponent,
    AlertsComponent,
    ColorPickerComponent,
    ColorSwatchComponent,
    FontPickerComponent,
    LoadingComponent,
    PrecisionRangeComponent,
    TabComponent,
    TabsComponent
  ],
})
export class UiModule { }
