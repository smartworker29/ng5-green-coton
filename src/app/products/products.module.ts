import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { ProductsComponent } from './products.component';
import { UiModule } from '../ui/ui.module';

@NgModule({
  imports: [ CommonModule, FormsModule, UiModule ],
  declarations: [
    ProductsComponent
  ],
  exports: [
    ProductsComponent
  ],
})
export class ProductsModule { }
