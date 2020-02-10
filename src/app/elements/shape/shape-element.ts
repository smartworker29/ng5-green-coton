import { Area } from '../../designs/area';
import { Color } from '../../colors/color';
import { DesignsService } from '../../designs/designs.service';
import { Element } from '../../element';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/Observable';
import * as SVG from 'svg.js';
const SVGBoundings = require('svg-boundings');
const svgpath = require('svgpath');

export class ShapeElement extends Element {
  shapeSvgElement: any;
  shapeOutlineElement: any;
  originalPoints: SVG.PointArray;
  originalPath: string;

  static newFromJson(json: object, area: Area): ShapeElement {
    const element = new ShapeElement(area);
    element.fromJson(json);
    element.fill = Color.fromJson(element.fill);
    return element;
  }

  static forType(type: string): SVG.Shape {
    switch (type) {
      case 'ellipse':
        return new SVG.Ellipse().size(200, 100);
      case 'heart':
        const path = 'M260.8 18.4c50.7 0 91.9 41.3 91.9 92.3 0 26.2-10.9 49.8-28.3'
          + ' 66.6l-148.4 149.8-151-152.5c-15.8-16.6-25.6-39.1-25.6-63.9 0-51 41.1-92.3 91.9-92.3 38.2 0'
          + ' 70.9 23.4 84.8 56.8 13.7-33.3 46.5-56.8 84.7-56.8';
        return new SVG.Path().plot(path);
      case 'rectangle':
        return new SVG.Rect().size(200, 100);
      case 'star':
        return new SVG.Polygon().plot('70,0 90,50 140,55 105,90 120,140 70,115 20,140 35,90 0,55 50,50');
      case 'triangle':
        return new SVG.Polygon().plot('130,50 0,275 260,275');
      default:
        return this.forType('ellipse');
    }
  }

  constructor(
    area: Area,
    type?: string,
  ) {
    super(area);

    this.type = type;
  }

  get type(): string { return this.data['type']; }
  set type(value: string) { this.data['type'] = value; }

  get fill(): Color { return this.data['fill']; }
  set fill(value: Color) { this.data['fill'] = value; }

  get originalWidth() { return this.data['originalWidth']; }
  set originalWidth(value: number) { this.data['originalWidth'] = value; }

  get originalHeight() { return this.data['originalHeight']; }
  set originalHeight(value: number) { this.data['originalHeight'] = value; }


  public render(): Observable<void> {
    return Observable.create((observer) => {
      if (!this.svgElement) {
        // preserveAspectRatio must be 'none' so that the shape inside the svg will stretch to match this svg's viewbox
        this.svgElement = this.area.distressContainer.nested()
          .attr('preserveAspectRatio', 'none')
          .addClass('elementWrapper')
        ;

        // draw a shape element
        switch (this.type) {
          case 'ellipse':
            this.svgElement.ellipse(200, 100);
            break;
          case 'rectangle':
            this.svgElement.rect(200, 100);
            break;
          case 'heart':
            this.svgElement.path('M260.8 18.4c50.7 0 91.9 41.3 91.9 92.3 0 26.2-10.9 49.8-28.3 66.6l-148.4'
              + ' 149.8-151-152.5c-15.8-16.6-25.6-39.1-25.6-63.9 0-51 41.1-92.3 91.9-92.3 38.2 0 70.9 23.4 84.8 56.8'
              + ' 13.7-33.3 46.5-56.8 84.7-56.8').size(185, 200);
            break;
          case 'star':
            this.svgElement.polygon('70,0 90,50 140,55 105,90 120,140 70,115 20,140 35,90 0,55 50,50');
            break;
          case 'triangle':
            this.svgElement.polygon('130,50 0,275 260,275');
            break;
          default:
            this.svgElement.ellipse(200, 100);
        }

        this.shapeSvgElement = this.svgElement.first();
        if (this.hasPoints) {
          this.originalPoints = (this.shapeSvgElement.array() as SVG.PointArray);
          this.originalWidth = this.shapeSvgElement.width();
          this.originalHeight = this.shapeSvgElement.height();
        } else if (this.hasPath) {
          this.originalPath = this.shapeSvgElement.plot().toString();
          this.originalWidth = this.shapeSvgElement.width();
          this.originalHeight = this.shapeSvgElement.height();
        }

        if (this.width && this.height) {
          this.resize(this.width, this.height, false);
        }

        this.addClickableBehavior();
        this.addDraggableBehavior();
        this.addSelectableBehavior();
        this.addResizableBehavior();
      }

      if (!this.id) {
        this.id = this.svgElement.attr('id');
      }

      // Clear rotation and flip and then reset them both
      this.shapeSvgElement.attr('transform', null);

      // rotate, flip, then scale
      if (this.hasPoints) {
        let matrix = new SVG.Matrix(this.resizableElement);
        if (this.flipAxis) {
          matrix = matrix.flip(this.flipAxis);
        }
        matrix = matrix.rotate(this.rotationDegrees);
        (this.resizableElement as SVG.Polygon).plot(this.transformPoints(matrix));

        // since originalPoints implies original size, we have to resize it again
        if (this.width && this.height) {
          this.resize(this.width, this.height, false);
        }

      } else if (this.hasPath) {
        this.flip();
        this.rotatePath(this.rotationDegrees);

      } else {
        this.flip();
        this.shapeSvgElement.transform({ rotation: this.rotationDegrees }, true);
      }

      if (this.fill.id === 'GARMENT_COLOR') {
        this.fill.rgb = this.area.design.productColor.swatch();
      }

      switch (this.type) {
        default:
          this.shapeSvgElement.fill(this.fill.rgb);
          break;
      }

      // can't center an svg using cx/cy, so must calculate its x/y to center it
      if (this.x === undefined || this.y === undefined) {
        const [cx, cy] = this.defaultPosition();
        const rbox = this.subElementBox();
        this.x = cx - rbox.width / 2 - rbox.x;
        this.y = cy - rbox.height / 2 - rbox.y;
      }

      if (this.width === undefined || this.height === undefined) {
        const bbox = this.wrapperBox();
        this.width = bbox.width;
        this.height = bbox.height;
      }

      this.rebuildEnabledEffects();

      this.scaleToFit();
      this.moveToFit();

      const box = this.subElementBox();
      this.svgElement
        .x(this.x)
        .y(this.y)
        .width(this.width)
        .height(this.height)
        .viewbox(box.x, box.y, box.w, box.h)
      ;

      observer.next();
      observer.complete();
    });
  }

  public colors(): Color[] {
    const colors = [this.fill];
    for (const effect of this.enabledEffects()) {
      if (effect.color) {
        colors.push(effect.color);
      }
    }
    return colors;
  }

  // Overriding duplicate() so we can also clear our subElements
  duplicate(): Element {
    const newElement = super.duplicate() as ShapeElement;
    newElement.shapeSvgElement = null;
    newElement.shapeOutlineElement = null;
    return newElement;
  }

  // NOTE: override resize() so we can scale the path coords instead of using .size()
  resize(width: number, height: number, keepCentered = true) {
    if (this.hasPath) {
      this.resizePath(width, height, keepCentered);
    } else {
      super.resize(width, height, keepCentered);
    }
  }

  toJson(): object {
    // we need to save the unrotated width/height incase they scaled the object
    const dataClone = Object.assign({}, this.data);
    const saveRotate = this.rotationDegrees;
    this.rotate(0);
    dataClone['width']  = this.width;
    dataClone['height'] = this.height;
    this.rotate(saveRotate);

    return {
      type: this.className,
      id: this.id,
      data: dataClone,
      effects: this.enabledEffects().map((e) => e.toJson()),
    };
  }

  // NOTE: overriding rotate() so we can modify the path coords directly instead of using transform
  rotate(degrees: number) {
    const oldBox = this.wrapperBox();

    if (this.hasPoints) {
      this.rotatePoints(degrees);
      const subElementBox = this.subElementBox();
      this.x = oldBox.cx - (subElementBox.width / 2);
      this.y = oldBox.cy - (subElementBox.height / 2);

      this.setWrapperDimensions();

    } else if (this.hasPath) {
      this.rotatePath(degrees);
      const subElementBox = this.subElementBox();
      this.x = oldBox.cx - (subElementBox.width / 2);
      this.y = oldBox.cy - (subElementBox.height / 2);

      this.setWrapperDimensions();

    } else {
      super.rotate(degrees);
    }
    this.rotationDegrees %= 360;
    if(this.rotationDegrees < 0) {
      this.rotationDegrees += 360;
    }
    this.updateDimensions();
  }

  protected resizeDoneHandler(e: Event) {
    this.setWrapperDimensions();
    this.updateDimensions();
  }

  protected resizableOptions(): object {
    const options = super.resizableOptions();
    options['preserveAspectRatio'] = false;
    return options;
  }

  protected layerDescription(): string {
    return 'Shape: ' + this.type;
  }

  get icon(): string {
    return '<img src="' + environment.assetUrl + 'assets/icons/shapes.svg" class="img-fluid" />';
  }

  get className(): string {
    return 'ShapeElement';
  }

  accurateBoundingBox(): SVG.Box {
    let box = null;
    const shapeNode = this.shapeSvgElement.node;
    switch (this.type) {
      case 'ellipse':
        box = SVGBoundings.ellipse(shapeNode, true);
        box.x = box.left;
        box.y = box.top;
        return box;
      case 'heart':
        box = SVGBoundings.path(shapeNode, true);
        box.x = box.left;
        box.y = box.top;
        return box;
      case 'rectangle':
        box = SVGBoundings.rect(shapeNode, true);
        box.x = box.left;
        box.y = box.top;
        return box;
      case 'star':
        box = SVGBoundings.polygon(shapeNode, true);
        box.x = box.left;
        box.y = box.top;
        return box;
      case 'triangle':
        box = SVGBoundings.polygon(shapeNode, true);
        box.x = box.left;
        box.y = box.top;
        return box;
      default:
        box = SVGBoundings.path(shapeNode, true);
        box.x = box.left;
        box.y = box.top;
        return box;
    }
  }

  get resizableElement(): SVG.Element {
    return this.shapeSvgElement;
  }

  get selectableElement(): SVG.Element {
    return this.shapeSvgElement;
  }

  get hasPoints(): boolean {
    return (this.type === 'star' || this.type === 'triangle');
  }

  get hasPath(): boolean {
    return this.type === 'heart';
  }

  private resizePath(width: number, height: number, keepCentered = true): void {
    const oldBox = this.wrapperBox();
    const cx = this.svgElement.cx();
    const cy = this.svgElement.cy();

    const scaleX = this.scaleX(width);
    const scaleY = this.scaleY(height);

    // get new path based on rotation
    const rotatedPath = svgpath(this.originalPath)
      .scale(scaleX, scaleY)
      .rotate(this.rotationDegrees, cx, cy)
      .toString()
    ;

    // set shape to use new path
    this.shapeSvgElement.plot(rotatedPath);

    if (keepCentered) {
      const subElementBox = this.subElementBox();
      this.x = oldBox.cx - (subElementBox.width / 2);
      this.y = oldBox.cy - (subElementBox.height / 2);
    }

    this.setWrapperDimensions();
  }

  private rotatePath(degrees: number): void {
    const cx = this.svgElement.cx();
    const cy = this.svgElement.cy();

    const degreesDiff = degrees - this.rotationDegrees;
    const rotatedPath = svgpath(this.shapeSvgElement.plot().toString())
      .rotate(degreesDiff, cx, cy)
      .toString()
    ;

    this.rotationDegrees = degrees;

    // set shape to use new path
    this.shapeSvgElement.plot(rotatedPath);

    this.setWrapperDimensions();
  }

  private flipPoints() {
    if (this.flipAxis) {
      const flippedMatrix = new SVG.Matrix(this.resizableElement).flip(this.flipAxis);
      // plot shape with new pointArray
      (this.resizableElement as SVG.Polygon).plot(this.transformPoints(flippedMatrix));
    }
  }

  private rotatePoints(degrees: number): void {
    // get matrix indicating current rotation
    const rotatedMatrix = new SVG.Matrix(this.resizableElement).rotate(degrees);


    // plot shape with new pointArray
    (this.resizableElement as SVG.Polygon).plot(this.transformPoints(rotatedMatrix));

    this.rotationDegrees = degrees;

    // but since originalPoints implies original size, we have to resize it again
    if (this.width && this.height) {
      this.resize(this.width, this.height, false);
    }
  }

  private transformPoints(matrix: SVG.Matrix): SVG.PointArray {
    const newPointArray = new Array<SVG.Point>();
    const newPoints = [];
    this.originalPoints.valueOf().forEach(p => {
      let point = new SVG.Point(p[0], p[1]);
      point = point.transform(matrix);
      newPoints.push([point['x'], point['y']]);
    });

    return new SVG.PointArray(newPoints);
  }

  private scaleX(width: number): number {
    const currentWidth = width || this.width || this.originalWidth;
    return this.originalWidth ? currentWidth / this.originalWidth : 1;
  }

  private scaleY(height: number): number {
    const currentHeight = height || this.height || this.originalHeight;
    return this.originalHeight ? currentHeight / this.originalHeight : 1;
  }
}
