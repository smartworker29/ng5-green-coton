/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';

import { AlertsService } from '../../ui/alerts.service';
import { Area } from '../../designs/area';
import { Clipart } from './clipart';
import { ClipartElement } from './clipart-element';
import { ClipartService } from './clipart.service';
import { ClipartMockService } from './clipart.mock.service';
import { Color } from '../../colors/color';
import { ColorsService } from '../../colors/colors.service';
import { ColorsMockService } from '../../colors/colors.mock.service';
import { Design } from '../../designs/design';
import { DesignsModule } from '../../designs/designs.module';
import { DesignsService } from '../../designs/designs.service';
import { ImagesService } from '../../images/images.service';
import { ImagesMockService } from '../../images/images.mock.service';
import { ProductsService } from '../../products/products.service';
import { ProductsMockService } from '../../products/products.mock.service';
import { Side } from '../../designs/side';
import * as SVG from 'svg.js';
import { SvgService } from '../../services/svg.service';
import { UiModule } from '../../ui/ui.module';

import { DesignTestHelper } from '../../designs/design-test-helper';

describe('ClipartElement', () => {

  this.element = null;
  this.colors = [];
  this.area = null;

  // based on observation of "I Heart" clipart in chrome
  const originalWidth = 224.12533569335938;
  const originalHeight = 128.64373779296875;

  const width45Degrees = 249.44540405273438;
  const height45Degrees = 249.44540405273438;

  beforeEach((done) => {
    TestBed.configureTestingModule({
      imports: [
        DesignsModule,
        UiModule,
      ],
      providers: [
        AlertsService,
        ClipartMockService,
        { provide: ClipartService, useValue: ClipartMockService },
        ColorsMockService,
        { provide: ColorsService, useValue: ColorsMockService },
        DesignsService,
        ImagesMockService,
        { provide: ImagesService, useValue: ImagesMockService },
        ProductsMockService,
        { provide: ProductsService, useValue: ProductsMockService },
        SvgService,
      ],
    });
    TestBed.compileComponents();

    const clipartService = TestBed.get(ClipartMockService);
    const colorsService = TestBed.get(ColorsMockService);
    const designsService = TestBed.get(DesignsService);
    const productsService = TestBed.get(ProductsMockService);
    const imagesService = TestBed.get(ImagesMockService);

    // before running each test, we need a rendered design
    DesignTestHelper.defaultDesign(designsService, colorsService, productsService, imagesService).subscribe((design) => {
      colorsService.getColors().subscribe(c => {
        this.colors = c;
        design.writeToSvg().subscribe((d) => {
          this.area = d.currentArea;
          const clipartInterface = new Clipart();
          clipartService.getClipart(clipartInterface).subscribe((clipart) => {
            this.element = new ClipartElement(this.area, colorsService, clipart);
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

  it('is tightly bound when the default size', () => {
    const wrapperBox = this.element.wrapperBox();
    expect(wrapperBox.width).toBeCloseTo(originalWidth);
    expect(wrapperBox.height).toBeCloseTo(originalHeight);

    expect(wrapperBox.cx).toBeCloseTo(this.element.area.maxImprintAreaElement.cx());
    expect(this.element.svgElement.width()).toBeCloseTo(wrapperBox.width);
    expect(this.element.svgElement.height()).toBeCloseTo(wrapperBox.height);
    DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, wrapperBox);
  });

  it('is tightly bound when resized to 250x125', (done) => {
    this.element.resize(250, 125);
    this.element.render().subscribe(() => {
      const wrapperBox = this.element.wrapperBox();
      expect(wrapperBox.width).toBeCloseTo(250);
      expect(wrapperBox.height).toBeCloseTo(125);

      expect(this.element.svgElement.width()).toBeCloseTo(wrapperBox.width);
      expect(this.element.svgElement.height()).toBeCloseTo(wrapperBox.height);
      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, wrapperBox);
      done();
    });
  });

  it('is tightly bound when rotated 45 degrees', (done) => {
    const originalWrapper = this.element.wrapperBox();
    this.element.rotate(45);
    this.element.render().subscribe(() => {
      const wrapperBox = this.element.wrapperBox();
      // based on obsvervation in Chrome
      expect(wrapperBox.width).toBeCloseTo(width45Degrees);
      expect(wrapperBox.height).toBeCloseTo(height45Degrees);

      expect(this.element.svgElement.width()).toEqual(wrapperBox.width);
      expect(this.element.svgElement.height()).toEqual(wrapperBox.height);
      expect(this.element.width).toEqual(wrapperBox.width);
      expect(this.element.height).toEqual(wrapperBox.height);
      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, wrapperBox);
      done();
    });
  });

  it('returns to original size when rotated and then reset', (done) => {
    this.element.rotate(45);
    this.element.render().subscribe(() => {
      this.element.rotate(0);
      this.element.render().subscribe(() => {
        const wrapperBox = this.element.wrapperBox();
        // based on obsvervation in Chrome
        expect(wrapperBox.width).toBeCloseTo(originalWidth);
        expect(wrapperBox.height).toBeCloseTo(originalHeight);

        expect(this.element.svgElement.width()).toEqual(wrapperBox.width);
        expect(this.element.svgElement.height()).toEqual(wrapperBox.height);
        expect(this.element.width).toEqual(wrapperBox.width);
        expect(this.element.height).toEqual(wrapperBox.height);
        DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, wrapperBox);
        done();
      });
    });
  });

  it('stays centered when resizing', (done) => {
    const oldBox = this.element.wrapperBox();

    this.element.resize(100, 50);
    this.element.render().subscribe(() => {
      const newBox = this.element.wrapperBox();
      expect(newBox.cx).toBeCloseTo(oldBox.cx);
      expect(newBox.cy).toBeCloseTo(oldBox.cy);
      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, newBox);
      done();
    });
  });

  it('stays centered when rotating', (done) => {
    this.element.y += 100; // move it down so rotating doesn't cause it to bump up against top edge of allowed area
    const oldBox = this.element.wrapperBox();
    this.element.rotate(15);
    this.element.render().subscribe(() => {
      const newBox = this.element.wrapperBox();
      expect(newBox.cx).toBeCloseTo(oldBox.cx);
      expect(newBox.cy).toBeCloseTo(oldBox.cy);
      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, newBox);
      done();
    });
  });

  it('correctly resizes when rotated', (done) => {
    this.element.rotate(10);
    const rotatedBox = this.element.wrapperBox();
    this.element.resize(250, 125);
    this.element.render().subscribe(() => {
      const resizedBox = this.element.wrapperBox();
      expect(resizedBox.cx).toBeCloseTo(rotatedBox.cx);
      expect(resizedBox.cy).toBeCloseTo(rotatedBox.cy);
      // based on observation -- seems right!
      expect(resizedBox.width).toBeCloseTo(250);
      expect(resizedBox.height).toBeCloseTo(125);
      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, resizedBox);
      done();
    });
  });
});

