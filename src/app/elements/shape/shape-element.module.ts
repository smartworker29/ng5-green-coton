import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UiModule } from '../../ui/ui.module';

import { ShapeOutlineComponent } from './effects/shape-outline.component';
import { ShapeElementComponent } from './shape-element.component';
import { ShapePickerComponent } from './shape-picker.component';
import { TransformComponent } from './effects/transform.component';

@NgModule({
  imports: [ CommonModule, FormsModule, InlineSVGModule, NgbModule, UiModule ],
  declarations: [
    ShapeOutlineComponent,
    ShapeElementComponent,
    ShapePickerComponent,
    TransformComponent,
  ],
  exports: [ ShapeElementComponent ],
})
export class ShapeElementModule { }
