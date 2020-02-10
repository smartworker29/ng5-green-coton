/* tslint:disable:no-unused-variable */

import { TestBed } from '@angular/core/testing';

import { AlertsService } from '../../ui/alerts.service';
import { Area } from '../../designs/area';
import { Color } from '../../colors/color';
import { ColorsService } from '../../colors/colors.service';
import { ColorsMockService } from '../../colors/colors.mock.service';
import { Design } from '../../designs/design';
import { DesignsModule } from '../../designs/designs.module';
import { DesignsService } from '../../designs/designs.service';
import { ImagesService } from '../../images/images.service';
import { ImagesMockService } from '../../images/images.mock.service';
import { ShapeOutline } from './effects/shape-outline';
import { ProductsService } from '../../products/products.service';
import { ProductsMockService } from '../../products/products.mock.service';
import { ShapeElement } from './shape-element';
import { Side } from '../../designs/side';
import * as SVG from 'svg.js';
import { SvgService } from '../../services/svg.service';
import { UiModule } from '../../ui/ui.module';

import { DesignTestHelper } from '../../designs/design-test-helper';

describe('Heart', () => {

  this.shape = null;
  this.colors = [];
  this.area = null;
  const originalWidth = 185;
  const originalHeight = 200;

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
          this.shape = new ShapeElement(this.area, 'heart');
          this.shape.fill = this.colors[0];
          this.area.addElement(this.shape);
          this.shape.render().subscribe(() => {
            this.shape.y = 100; // move shape down so resizing/rotating doesn't bump against top edge
            done();
          });
        });
      });
    });
  });

  afterEach(() => {
    this.shape.remove();
  });


  it('is tightly bound when the default size', () => {
    const wrapperBox = this.shape.wrapperBox();
    expect(wrapperBox.width).toBeCloseTo(originalWidth);
    expect(wrapperBox.height).toBeCloseTo(originalHeight);

    expect(this.shape.svgElement.width()).toEqual(wrapperBox.width);
    expect(this.shape.svgElement.height()).toEqual(wrapperBox.height);
    DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.shape, wrapperBox);
  });

  it('is tightly bound when resized to 210x210', (done) => {
    this.shape.resize(210, 210);
    this.shape.render().subscribe(() => {
      const wrapperBox = this.shape.wrapperBox();
      const accurateBox = this.shape.accurateBoundingBox();
      expect(wrapperBox.width).toEqual(accurateBox.width);
      expect(wrapperBox.height).toEqual(accurateBox.height);

      expect(this.shape.svgElement.width()).toEqual(wrapperBox.width);
      expect(this.shape.svgElement.height()).toEqual(wrapperBox.height);
      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.shape, wrapperBox);
      done();
    });
  });

  it('is tightly bound when rotated 45 degrees', (done) => {
    this.shape.rotate(45);
    this.shape.render().subscribe(() => {
      const wrapperBox = this.shape.wrapperBox();
      const subElementBox = this.shape.subElementBox();
      // based these numbers on observation
      expect(wrapperBox.width).toBeCloseTo(184.80784091812507);
      expect(wrapperBox.height).toBeCloseTo(184.78634104014242);

      expect(this.shape.svgElement.width()).toBeCloseTo(wrapperBox.width);
      expect(this.shape.svgElement.height()).toBeCloseTo(wrapperBox.height);
      expect(this.shape.width).toBeCloseTo(wrapperBox.width);
      expect(this.shape.height).toBeCloseTo(wrapperBox.height);
      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.shape, wrapperBox);
      done();
    });
  });

  it('stays centered when resizing', (done) => {
    const oldBox = this.shape.wrapperBox();

    this.shape.resize(100, 100);
    this.shape.render().subscribe(() => {
      const newBox = this.shape.wrapperBox();
      expect(newBox.cx).toBeCloseTo(oldBox.cx);
      expect(newBox.cy).toBeCloseTo(oldBox.cy);
      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.shape, newBox);
      done();
    });
  });

  it('stays centered when rotating', (done) => {
    const oldBox = this.shape.wrapperBox();

    this.shape.rotate(30);
    this.shape.render().subscribe(() => {
      const newBox = this.shape.wrapperBox();
      expect(newBox.cx).toBeCloseTo(oldBox.cx);
      expect(newBox.cy).toBeCloseTo(oldBox.cy);
      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.shape, newBox);
      done();
    });
  });

  it('correctly resizes when rotated', (done) => {
    this.shape.rotate(30);
    const rotatedBox = this.shape.wrapperBox();

    this.shape.resize(250, 125);
    this.shape.render().subscribe(() => {
      const resizedBox = this.shape.wrapperBox();

      expect(resizedBox.cx).toBeCloseTo(rotatedBox.cx);
      expect(resizedBox.cy).toBeCloseTo(rotatedBox.cy);
      // these numbers based on observation
      expect(resizedBox.width).toBeCloseTo(222.56329953037738);
      expect(resizedBox.height).toBeCloseTo(151.74120669655534);
      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.shape, resizedBox);
      done();
    });
  });

  describe('when flipped', () => {
    let originalWrapperBox = null;

    beforeEach((done) => {
      originalWrapperBox = this.shape.wrapperBox();
      this.shape.flipAxis = 'y';
      this.shape.render().subscribe(() => { done(); });
    });

    it('stays centered', () => {
      const wrapperBox = this.shape.wrapperBox();
      expect(wrapperBox.cx).toEqual(originalWrapperBox.cx);
      expect(wrapperBox.cy).toEqual(originalWrapperBox.cy);
    });

    it('stays centered when rotated', (done) => {
      this.shape.rotate(30);
      this.shape.render().subscribe(() => {
        const wrapperBox = this.shape.wrapperBox();

        expect(wrapperBox.cx).toBeCloseTo(originalWrapperBox.cx);
        expect(wrapperBox.cy).toBeCloseTo(originalWrapperBox.cy);
        done();
      });
    });

    it('stays centered when rotated twice', (done) => {
      this.shape.rotate(30);
      this.shape.render().subscribe(() => {
        this.shape.rotate(40);
        this.shape.render().subscribe(() => {
          const wrapperBox = this.shape.wrapperBox();

          expect(wrapperBox.cx).toBeCloseTo(originalWrapperBox.cx);
          expect(wrapperBox.cy).toBeCloseTo(originalWrapperBox.cy);
          done();
        });
      });
    });
  });

  describe('with an outline', () => {
    beforeEach((done) => {
      const outline = new ShapeOutline();
      outline.enabled = true;
      outline.color = this.colors[1];
      outline.element = this.shape;
      this.shape.addEffect(outline);
      this.shape.render().subscribe(() => { done(); });
    });

    it('is tightly bound when the default size', () => {
      const wrapperBox = this.shape.wrapperBox();
      const subElementBox = this.shape.subElementBox();

      // wrapper should stay the same size
      expect(wrapperBox.width).toBeCloseTo(originalWidth);
      expect(wrapperBox.height).toBeCloseTo(originalHeight);

      // and the wrapper's viewbox should reflect the larger element
      // TODO: fixme... the viewbox has non-zero x/y.. is that right?
      const viewBox = this.shape.svgElement.viewbox();
      expect(viewBox.width).toBeCloseTo(originalWidth);
      expect(viewBox.height).toBeCloseTo(originalHeight);

      // The subElementBox should be the same width/height as the wrapper
      expect(subElementBox.width).toEqual(wrapperBox.width);
      expect(subElementBox.height).toEqual(wrapperBox.height);

      expect(this.shape.svgElement.width()).toEqual(wrapperBox.width);
      expect(this.shape.svgElement.height()).toEqual(wrapperBox.height);
      DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.shape, wrapperBox);
    });

    it('is tightly bound when resized to 250x125', (done) => {
      this.shape.resize(250, 125);
      this.shape.render().subscribe(() => {
        const wrapperBox = this.shape.wrapperBox();
        expect(wrapperBox.width).toBeCloseTo(250);
        expect(wrapperBox.height).toBeCloseTo(125);

        expect(this.shape.svgElement.width()).toEqual(wrapperBox.width);
        expect(this.shape.svgElement.height()).toEqual(wrapperBox.height);
        DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.shape, wrapperBox);
        done();
      });
    });

    it('is tightly bound when rotated 45 degrees', (done) => {
      this.shape.rotate(45);
      this.shape.render().subscribe(() => {
        const wrapperBox = this.shape.wrapperBox();
        // based on observation
        expect(wrapperBox.width).toBeCloseTo(184.807840918125);
        expect(wrapperBox.height).toBeCloseTo(184.78634104014245);

        expect(this.shape.svgElement.width()).toBeCloseTo(wrapperBox.width);
        expect(this.shape.svgElement.height()).toBeCloseTo(wrapperBox.height);
        expect(this.shape.width).toBeCloseTo(wrapperBox.width);
        expect(this.shape.height).toBeCloseTo(wrapperBox.height);
        DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.shape, wrapperBox);
        done();
      });
    });

    it('stays centered when resizing', (done) => {
      const oldBox = this.shape.wrapperBox();

      this.shape.resize(100, 50);
      this.shape.render().subscribe(() => {
        const newBox = this.shape.wrapperBox();
        expect(newBox.cx).toBeCloseTo(oldBox.cx);
        expect(newBox.cy).toBeCloseTo(oldBox.cy);
        DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.shape, newBox);
        done();
      });
    });

    it('stays centered when rotating', (done) => {
      const oldBox = this.shape.wrapperBox();

      this.shape.rotate(30);
      this.shape.render().subscribe(() => {
        const newBox = this.shape.wrapperBox();
        expect(newBox.cx).toBeCloseTo(oldBox.cx);
        expect(newBox.cy).toBeCloseTo(oldBox.cy);
        DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.shape, newBox);
        done();
      });
    });

    it('correctly resizes when rotated', (done) => {
      this.shape.rotate(30);
      const rotatedBox = this.shape.wrapperBox();

      this.shape.resize(250, 125);
      this.shape.render().subscribe(() => {
        const resizedBox = this.shape.wrapperBox();

        expect(resizedBox.cx).toBeCloseTo(rotatedBox.cx);
        expect(resizedBox.cy).toBeCloseTo(rotatedBox.cy);
        // based on observation
        expect(resizedBox.width).toBeCloseTo(222.56329953037738);
        expect(resizedBox.height).toBeCloseTo(151.74120669655534);
        DesignTestHelper.expectSelectBoxToTightlyBoundWrapperBox(this.shape, resizedBox);
        done();
      });
    });
  });
});
