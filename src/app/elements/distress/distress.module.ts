import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DistressComponent } from './distress.component';
import { InlineSVGModule } from 'ng-inline-svg';

@NgModule({
  imports: [ CommonModule, FormsModule, InlineSVGModule ],
  declarations: [ DistressComponent ],
  exports: [ DistressComponent ],
})
export class DistressModule { }
