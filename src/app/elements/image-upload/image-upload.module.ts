import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg';
import { UiModule } from '../../ui/ui.module';

import { ImageUploadComponent } from './image-upload.component';
import { TransformComponent } from './effects/transform.component';


@NgModule({
  imports: [ CommonModule, FormsModule, InlineSVGModule, UiModule ],
  declarations: [
    ImageUploadComponent,
    TransformComponent,
  ],
  exports: [ ImageUploadComponent ],
})
export class ImageUploadModule { }
