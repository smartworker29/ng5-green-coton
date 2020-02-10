/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';

import { AlertsService } from './ui/alerts.service';
import { AppComponent } from './app.component';
import { ClipartModule } from './elements/clipart/clipart.module';
import { ColorsService } from './colors/colors.service';
import { CookiesService } from './services/cookies.service';
import { DesignsModule } from './designs/designs.module';
import { DesignsService } from './designs/designs.service';
import { DistressModule } from './elements/distress/distress.module';
import { DialogService } from './ui/dialog.service';
import { FontPickerService } from './ui/font-picker.service';
import { GlobalService } from './services/global.service';
import { FormsModule } from '@angular/forms';
import { ImageUploadModule } from './elements/image-upload/image-upload.module';
import { ImagesService } from './images/images.service';
import { InlineSVGModule } from 'ng-inline-svg';
import { LayersModule } from './elements/layers/layers.module';
import { NamesAndNumbersModule } from './elements/names-and-numbers/names-and-numbers.module';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PricingModule } from './pricing/pricing.module';
import { ProductsService } from './products/products.service';
import { ShapeElementModule } from './elements/shape/shape-element.module';
import { SvgService } from './services/svg.service';
import { TextElementModule } from './elements/text/text-element.module';
import { UiModule } from './ui/ui.module';
import { ZoomComponent } from './zoom/zoom.component';


describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        ZoomComponent,
      ],
      imports: [
        ClipartModule,
        DesignsModule,
        DistressModule,
        FormsModule,
        ImageUploadModule,
        InlineSVGModule,
        LayersModule,
        NamesAndNumbersModule,
        NgbModule.forRoot(),
        PricingModule,
        ShapeElementModule,
        TextElementModule,
        UiModule,
      ],
      providers: [
        AlertsService,
        ColorsService,
        CookiesService,
        DesignsService,
        DialogService,
        FontPickerService,
        GlobalService,
        ImagesService,
        NgbModal,
        ProductsService,
        SvgService,
      ]
    });
    TestBed.compileComponents();
  });

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
