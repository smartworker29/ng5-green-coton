import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InlineSVGModule } from 'ng-inline-svg';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UiModule } from '../../ui/ui.module';

import { LayersComponent } from './layers.component';

@NgModule({
  imports: [ CommonModule, InlineSVGModule, NgbModule, UiModule ],
  declarations: [ LayersComponent ],
  exports: [ LayersComponent ],
})
export class LayersModule { }
