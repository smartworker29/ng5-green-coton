/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';

import { AlertsService } from '../../ui/alerts.service';
import { Area } from '../../designs/area';
import { Color } from '../../colors/color';
import { ColorsService } from '../../colors/colors.service';
import { ColorsMockService } from '../../colors/colors.mock.service';
import { Design } from '../../designs/design';
import { DesignsModule } from '../../designs/designs.module';
import { DesignsService } from '../../designs/designs.service';
import { FontPickerService } from '../../ui/font-picker.service';
import { FontPickerMockService } from '../../ui/font-picker.mock.service';
import { ImagesService } from '../../images/images.service';
import { ImagesMockService } from '../../images/images.mock.service';
import { ProductsService } from '../../products/products.service';
import { ProductsMockService } from '../../products/products.mock.service';
import { Side } from '../../designs/side';
import * as SVG from 'svg.js';
import { SvgService } from '../../services/svg.service';

import { NamesAndNumbersElement } from './names-and-numbers-element';

import { DesignTestHelper } from '../../designs/design-test-helper';

describe('NamesAndNumbersElement', () => {

  this.element = null;
  this.colors = [];
  this.area = null;

  // based on observation of default text in chrome
  const originalWidth = 299;
  const originalHeight = 277.05936962366104;

  beforeEach((done) => {
    TestBed.configureTestingModule({
      imports: [
        DesignsModule,
      ],
      providers: [
        AlertsService,
        ColorsMockService,
        { provide: ColorsService, useValue: ColorsMockService },
        DesignsService,
        FontPickerMockService,
        { provide: FontPickerService, useValue: FontPickerMockService },
        ImagesMockService,
        { provide: ImagesService, useValue: ImagesMockService },
        ProductsMockService,
        { provide: ProductsService, useValue: ProductsMockService },
        SvgService,
      ],
    });
    TestBed.compileComponents();

    const colorsService = TestBed.get(ColorsMockService);
    const designsService = TestBed.get(DesignsService);
    const fontService = TestBed.get(FontPickerMockService);
    const productsService = TestBed.get(ProductsMockService);
    const imagesService = TestBed.get(ImagesMockService);

    // before running each test, we need a rendered design
    DesignTestHelper.defaultDesign(designsService, colorsService, productsService, imagesService).subscribe((design) => {
      colorsService.getColors().subscribe(c => {
        this.colors = c;
        design.writeToSvg().subscribe((d) => {
          this.area = d.currentArea;
          this.element = new NamesAndNumbersElement(this.area);
          this.element.nameFill = this.colors[0];
          this.element.numberFill = this.colors[0];

          fontService.getFont(fontService.defaultFontFamily()).subscribe((font) => {
            this.element.nameFont = font;
            this.element.numberFont = font;
            this.element.render().subscribe(() => {
              this.area.addElement(this.element);
              done();
            });
          });
        });
      });
    });
  });

  afterEach(() => {
    this.element.remove();
  });

  it('doesnt asplode', () => {
    expect(this.element).toBeTruthy();
  });

  it('should have a name that is 2\" tall', () => {
    expect(this.element.nameElementWrapper.height()).toEqual(2 * this.element.area.side.pixelsPerInch);
  });

  it('should have 3" of space between names and numbers', () => {
    const nameBottom = this.element.nameElementWrapper.y();
    const numberTop = this.element.numberElementWrapper.y() - this.element.numberElementWrapper.height();
    expect(numberTop - nameBottom).toEqual(3 * this.element.area.side.pixelsPerInch);
  });

  it('should have numbers that are 7" tall', () => {
    expect(this.element.numberElementWrapper.height()).toEqual(7 * this.element.area.side.pixelsPerInch);
  });
});

