import { NgModule, Inject, Injectable, Injector, InjectionToken } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import {APP_BASE_HREF} from '@angular/common';
import { Routes, ActivatedRoute, RouterModule } from '@angular/router';
import { Http, HttpModule, XHRBackend, RequestOptions } from '@angular/http';
import { httpFactory } from './services/http-with-cookies';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { setAppInjector } from './app-injector';

import { environment } from '../environments/environment';
import { AccountService } from './services/account.service';
import { AirbrakeErrorHandler } from './airbrake-error-handler';
import { AlertsService } from './ui/alerts.service';
import { ColorsService } from './colors/colors.service';
import { CookiesService } from './services/cookies.service';
import { DesignsModule } from './designs/designs.module';
import { DesignsService } from './designs/designs.service';
import { DialogService } from './ui/dialog.service';
import { ElementService } from './services/element.service';
import { ErrorHandler } from '@angular/core';
import { FontPickerService } from './ui/font-picker.service';
import { GlobalService } from './services/global.service';
import { ImagesService } from './images/images.service';
import { InlineSVGModule } from 'ng-inline-svg';
import { PricingService } from './pricing/pricing.service';
import { ProductsModule } from './products/products.module';
import { ProductsService } from './products/products.service';
import { SvgService } from './services/svg.service';
import { UiModule } from './ui/ui.module';

import { ClipartModule } from './elements/clipart/clipart.module';
import { DistressModule } from './elements/distress/distress.module';
import { ImageUploadModule } from './elements/image-upload/image-upload.module';
import { LayersModule } from './elements/layers/layers.module';
import { NamesAndNumbersModule } from './elements/names-and-numbers/names-and-numbers.module';
import { ShapeElementModule } from './elements/shape/shape-element.module';
import { TextElementModule } from './elements/text/text-element.module';
import { ZoomComponent } from './zoom/zoom.component';
import { RollbarService, rollbarFactory, RollbarErrorHandler } from './rollbar';

@NgModule({
  imports: [
    BrowserModule,
    ClipartModule,
    DesignsModule,
    DistressModule,
    HttpModule,
    ImageUploadModule,
    InlineSVGModule.forRoot({ baseUrl: environment.assetUrl }),
    LayersModule,
    NamesAndNumbersModule,
    NgbModule.forRoot(),
    ProductsModule,
    ShapeElementModule,
    TextElementModule,
    UiModule,
    RouterModule.forRoot([]),
  ],
  declarations: [
    AppComponent,
    ZoomComponent,
  ],
  providers: [
    AccountService,
    { provide: ErrorHandler, useClass: RollbarErrorHandler },
    { provide: RollbarService, useFactory: rollbarFactory },
    AlertsService,
    ColorsService,
    CookiesService,
    DesignsService,
    DialogService,
    ElementService,
    FontPickerService,
    {
      provide: Http,
      useFactory: httpFactory,
      deps: [XHRBackend, RequestOptions]
    },
    GlobalService,
    ImagesService,
    PricingService,
    ProductsService,
    SvgService,
    {
      provide: APP_BASE_HREF,
      useValue: '/designer'
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(injector: Injector) {
    setAppInjector(injector);
  }
}
