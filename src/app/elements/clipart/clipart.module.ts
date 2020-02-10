import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClipartBrowserComponent } from './clipart-browser.component';
import { ClipartComponent } from './clipart.component';
import { ClipartService } from './clipart.service';
import { InlineSVGModule } from 'ng-inline-svg';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TransformComponent } from './effects/transform.component';
import { UiModule } from '../../ui/ui.module';

@NgModule({
  imports: [ CommonModule, FormsModule, InlineSVGModule, NgbModule, UiModule ],
  declarations: [ ClipartBrowserComponent, ClipartComponent, TransformComponent ],
  providers: [ ClipartService ],
  exports: [ ClipartComponent ],
})
export class ClipartModule { }
