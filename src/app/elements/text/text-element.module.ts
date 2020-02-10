import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg';
import { UiModule } from '../../ui/ui.module';

import { DropShadowComponent } from './effects/drop-shadow.component';
import { OutlineComponent } from './effects/outline.component';
import { OutlineTwoComponent } from './effects/outline-two.component';
import { TextElementComponent } from './text-element.component';
import { TextShapeComponent } from './effects/text-shape.component';
import { TransformComponent } from './effects/transform.component';

@NgModule({
  imports: [ CommonModule, FormsModule, InlineSVGModule, UiModule ],
  declarations: [
    DropShadowComponent,
    OutlineComponent,
    OutlineTwoComponent,
    TextElementComponent,
    TextShapeComponent,
    TransformComponent,
  ],
  exports: [ TextElementComponent ],
})
export class TextElementModule { }
