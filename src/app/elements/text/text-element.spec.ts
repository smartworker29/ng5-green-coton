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
import { TextElement } from './text-element';
import { DropShadow } from './effects/drop-shadow';
import { Outline as TextOutline } from './effects/outline';
import { UiModule } from '../../ui/ui.module';

import { DesignTestHelper } from '../../designs/design-test-helper';

describe('TextElement', () => {

  this.element = null;
  this.colors = [];
  this.area = null;

  // based on observation of "Enter Text" in chrome
  const originalWidth = 173.92000579833984;
  const originalHeight = 39.87999725341797;

  const width45Degrees = 151.1794265808059;
  const height45Degrees = 151.1794265808059;

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
          this.element = new TextElement(this.area);
          this.element.fill = this.colors[0];

          this.element.editing = true;
          fontService.getFont(fontService.defaultFontFamily()).subscribe((font) => {
            this.element.font = font;
            this.element.textChanged = true;
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
    expect(this.element.svgElement.width()).toEqual(wrapperBox.width);
    expect(this.element.svgElement.height()).toEqual(wrapperBox.height);
    DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, wrapperBox);
  });

  it('is tightly bound when resized to 250x125', (done) => {
    this.element.resize(250, 125);
    this.element.render().subscribe(() => {
      const wrapperBox = this.element.wrapperBox();
      expect(wrapperBox.width).toBeCloseTo(250);
      expect(wrapperBox.height).toBeCloseTo(125);

      expect(this.element.svgElement.width()).toEqual(wrapperBox.width);
      expect(this.element.svgElement.height()).toEqual(wrapperBox.height);
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

  describe('with an outline', () => {
    beforeEach((done) => {
      const outline = new TextOutline();
      outline.enabled = true;
      outline.color = this.colors[1];
      outline.element = this.element;
      this.element.addEffect(outline);
      this.element.render().subscribe(() => {
        done();
      });
    });

    it('is tightly bound when the default size', () => {
      const wrapperBox = this.element.wrapperBox();
      const subElementBox = this.element.subElementBox();

      // wrapper should stay same size
      expect(wrapperBox.width).toBeCloseTo(originalWidth);
      expect(wrapperBox.height).toBeCloseTo(originalHeight);
      expect(this.element.svgElement.width()).toEqual(wrapperBox.width);
      expect(this.element.svgElement.height()).toEqual(wrapperBox.height);

      // and the wrapper's viewbox should reflect the larger element
      const viewbox = this.element.svgElement.viewbox();
      expect(viewbox.x).toEqual(0);
      expect(viewbox.y).toEqual(0);
      expect(viewbox.width).toBeCloseTo(originalWidth);
      expect(viewbox.height).toBeCloseTo(originalHeight);

      // The subElementBox should be the same width/height as the wrapper
      expect(subElementBox.width).toEqual(wrapperBox.width);
      expect(subElementBox.height).toEqual(wrapperBox.height);

      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, wrapperBox);
    });

    it('is tightly bound when resized to 250x125', (done) => {
      this.element.resize(250, 125);
      this.element.render().subscribe(() => {
        // wrapper should still be the same size
        const wrapperBox = this.element.wrapperBox();
        expect(wrapperBox.width).toBeCloseTo(250);
        expect(wrapperBox.height).toBeCloseTo(125);

        const viewbox = this.element.svgElement.viewbox();
        expect(viewbox.x).toEqual(0);
        expect(viewbox.y).toEqual(0);
        expect(viewbox.width).toBeCloseTo(250);
        expect(viewbox.height).toBeCloseTo(125);

        // the subElementBox should be the same width/height as the wrapper
        const subElementBox = this.element.subElementBox();
        expect(subElementBox.width).toEqual(wrapperBox.width);
        expect(subElementBox.height).toEqual(wrapperBox.height);

        // The actual element's width/height should be the requested size
        expect(this.element.imageElement.width()).toEqual(wrapperBox.width);
        expect(this.element.imageElement.height()).toEqual(wrapperBox.height);
        expect(this.element.imageElement.x()).toEqual(0);
        expect(this.element.imageElement.y()).toEqual(0);

        DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, wrapperBox);

        done();
      });
    });

    it('is tightly bound when rotated 45 degrees', (done) => {
      this.element.rotate(45);
      this.element.render().subscribe(() => {
        const wrapperBox = this.element.wrapperBox();
        expect(wrapperBox.width).toBeCloseTo(151.1794265808059);
        expect(wrapperBox.height).toBeCloseTo(151.1794265808059);

        expect(this.element.svgElement.width()).toBeCloseTo(wrapperBox.width);
        expect(this.element.svgElement.height()).toBeCloseTo(wrapperBox.height);
        expect(this.element.width).toBeCloseTo(wrapperBox.width);
        expect(this.element.height).toBeCloseTo(wrapperBox.height);
        DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, wrapperBox);

        done();
      });
    });

    it('stays centered when resizing', (done) => {
      const oldBox = this.element.wrapperBox();

      this.element.resize(100, 50);
      this.element.render().subscribe(() => {
        const newBox = this.element.wrapperBox();
        expect(newBox.cx).toBeCloseTo(oldBox.cx);
        expect(newBox.cy).toBeCloseTo(oldBox.cy);
        done();
      });
    });

    it('stays centered when resizing twice', (done) => {
      const oldBox = this.element.wrapperBox();

      this.element.resize(100, 50);
      this.element.resize(110, 60);
      this.element.render().subscribe(() => {
        const newBox = this.element.wrapperBox();
        expect(newBox.cx).toBeCloseTo(oldBox.cx);
        expect(newBox.cy).toBeCloseTo(oldBox.cy);
        done();
      });
    });

    it('stays centered when rotating', (done) => {
      const oldBox = this.element.wrapperBox();

      this.element.rotate(30);
      this.element.render().subscribe(() => {
        const newBox = this.element.wrapperBox();
        expect(newBox.cx).toBeCloseTo(oldBox.cx);
        expect(newBox.cy).toBeCloseTo(oldBox.cy);
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

        done();
      });
    });
  });

  describe('with a dropshadow', () => {
    beforeEach((done) => {
      const dropShadow = new DropShadow();
      dropShadow.enabled = true;
      dropShadow.color = this.colors[3];
      dropShadow.element = this.element;
      this.element.addEffect(dropShadow);
      this.element.render().subscribe(() => {
        done();
      });
    });

    it('stays the same size and is tightly bound', () => {
      const wrapperBox = this.element.wrapperBox();
      const subElementBox = this.element.subElementBox();

      // wrapper should stay same size
      expect(wrapperBox.width).toBeCloseTo(originalWidth);
      expect(wrapperBox.height).toBeCloseTo(originalHeight);
      expect(this.element.svgElement.width()).toEqual(wrapperBox.width);
      expect(this.element.svgElement.height()).toEqual(wrapperBox.height);

      // and the wrapper's viewbox should reflect the larger element
      const viewbox = this.element.svgElement.viewbox();
      expect(viewbox.x).toEqual(0);
      expect(viewbox.y).toEqual(0);
      expect(viewbox.width).toBeCloseTo(originalWidth);
      expect(viewbox.height).toBeCloseTo(originalHeight);

      // The subElementBox should be the same width/height as the wrapper
      expect(subElementBox.width).toEqual(wrapperBox.width);
      expect(subElementBox.height).toEqual(wrapperBox.height);

      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, wrapperBox);
    });

    it('is tightly bound when resized to 250x125', (done) => {
      this.element.resize(250, 125);
      this.element.render().subscribe(() => {
        // wrapper should still be the same size
        const wrapperBox = this.element.wrapperBox();
        expect(wrapperBox.width).toBeCloseTo(250);
        expect(wrapperBox.height).toBeCloseTo(125);

        const viewbox = this.element.svgElement.viewbox();
        expect(viewbox.x).toEqual(0);
        expect(viewbox.y).toEqual(0);
        expect(viewbox.width).toBeCloseTo(250);
        expect(viewbox.height).toBeCloseTo(125);

        // the subElementBox should be the same width/height as the wrapper
        const subElementBox = this.element.subElementBox();
        expect(subElementBox.width).toEqual(wrapperBox.width);
        expect(subElementBox.height).toEqual(wrapperBox.height);

        // The actual element's width/height should be the requested size
        expect(this.element.imageElement.width()).toEqual(wrapperBox.width);
        expect(this.element.imageElement.height()).toEqual(wrapperBox.height);
        expect(this.element.imageElement.x()).toEqual(0);
        expect(this.element.imageElement.y()).toEqual(0);

        DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, wrapperBox);

        done();
      });
    });

    it('is tightly bound when rotated 45 degrees', (done) => {
      this.element.rotate(45);
      this.element.render().subscribe(() => {
        const wrapperBox = this.element.wrapperBox();
        expect(wrapperBox.width).toBeCloseTo(151.1794265808059);
        expect(wrapperBox.height).toBeCloseTo(151.1794265808059);

        expect(this.element.svgElement.width()).toBeCloseTo(wrapperBox.width);
        expect(this.element.svgElement.height()).toBeCloseTo(wrapperBox.height);
        expect(this.element.width).toBeCloseTo(wrapperBox.width);
        expect(this.element.height).toBeCloseTo(wrapperBox.height);
        DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.element, wrapperBox);

        done();
      });
    });

    it('stays centered when resizing', (done) => {
      const oldBox = this.element.wrapperBox();

      this.element.resize(100, 50);
      this.element.render().subscribe(() => {
        const newBox = this.element.wrapperBox();
        expect(newBox.cx).toBeCloseTo(oldBox.cx);
        expect(newBox.cy).toBeCloseTo(oldBox.cy);
        done();
      });
    });

    it('stays centered when resizing twice', (done) => {
      const oldBox = this.element.wrapperBox();

      this.element.resize(100, 50);
      this.element.resize(110, 60);
      this.element.render().subscribe(() => {
        const newBox = this.element.wrapperBox();
        expect(newBox.cx).toBeCloseTo(oldBox.cx);
        expect(newBox.cy).toBeCloseTo(oldBox.cy);
        done();
      });
    });

    it('stays centered when rotating', (done) => {
      const oldBox = this.element.wrapperBox();

      this.element.rotate(30);
      this.element.render().subscribe(() => {
        const newBox = this.element.wrapperBox();
        expect(newBox.cx).toBeCloseTo(oldBox.cx);
        expect(newBox.cy).toBeCloseTo(oldBox.cy);
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

        done();
      });
    });
  });
});

