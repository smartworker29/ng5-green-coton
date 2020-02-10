/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import { Injector } from '@angular/core';

import { AlertsService } from '../../ui/alerts.service';
import { Area } from '../../designs/area';
import { Color } from '../../colors/color';
import { ColorsService } from '../../colors/colors.service';
import { ColorsMockService } from '../../colors/colors.mock.service';
import { Design } from '../../designs/design';
import { DesignsModule } from '../../designs/designs.module';
import { DesignsService } from '../../designs/designs.service';
import { Image } from '../../images/image';
import { ImageFixture } from '../../images/fixtures/image.fixture';
import { ImagesService } from '../../images/images.service';
import { ImagesMockService } from '../../images/images.mock.service';
import { ImageUploadElement } from './image-upload-element';
import { ProductsService } from '../../products/products.service';
import { ProductsMockService } from '../../products/products.mock.service';
import { Side } from '../../designs/side';
import * as SVG from 'svg.js';
import { SvgService } from '../../services/svg.service';
import { UiModule } from '../../ui/ui.module';

import { DesignTestHelper } from '../../designs/design-test-helper';

describe('ImageUploadElement', () => {

  this.element = null;
  this.colors = [];
  this.area = null;

  // based on observation of test image in Chrome
  const originalWidth = 140;
  const originalHeight = 140;

  const width45Degrees = 197.989898732233307;
  const height45Degrees = 197.989898732233307;

  beforeEach((done) => {
    TestBed.configureTestingModule({
      imports: [
        DesignsModule,
        UiModule,
      ],
      providers: [
        AlertsService,
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

    const colorsService = TestBed.get(ColorsMockService);
    const designsService = TestBed.get(DesignsService);
    const productsService = TestBed.get(ProductsMockService);
    const imagesService = TestBed.get(ImagesMockService);
    const image = new ImageFixture();

    // before running each test, we need a rendered design
    DesignTestHelper.defaultDesign(designsService, colorsService, productsService, imagesService).subscribe((design) => {
      colorsService.getColors().subscribe(c => {
        this.colors = c;
        design.writeToSvg().subscribe((d) => {
          this.area = d.currentArea;
          this.element = new ImageUploadElement(this.area, image);
          this.element.printMethod = 'single';
          this.element.imageColors = [this.colors[0]];
          this.element.render().subscribe(() => {

            // The native image is too large for the area, so we'll size it down for simpler testing
            this.element.resize(originalWidth, originalHeight);
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
      expect(resizedBox.width).toBeCloseTo(231.26297113810682);
      expect(resizedBox.height).toBeCloseTo(143.73702886189312);
      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, resizedBox);
      done();
    });
  });
});

