import { Design } from './design';
import { Element } from '../element';
import { ElementFactory } from '../element-factory';
import { ImageUploadElement } from '../elements/image-upload/image-upload-element';
import { ImagesService } from '../images/images.service';
import { Layer } from '../elements/layers/layer';
import { Side } from './side';
import * as SVG from 'svg.js';
import { environment } from '../../environments/environment';

export class Area {
  public  design: Design;
  public  name: string;
  public svgElement: SVG.Nested;
  private imagesService: ImagesService;
  public maxImprintAreaElement: SVG.Nested;
  public maxImprintAreaElementX: number;
  public maxImprintAreaElementY: number;
  public maxImprintAreaElementW: number;
  public maxImprintAreaElementH: number;
  public coords: any;
  public side: Side;
  private _elements: Element[] = [];

  static newFromJson(json: object, design: Design, side: Side, imagesService: ImagesService): Area {
    const area = new Area(design, side, null, null, imagesService);
    area.fromJson(json);
    return area;
  }

  constructor(
    design: Design,
    side: Side,
    index: number,
    coords: any,
    imagesService: ImagesService,
  ) {
    this.design = design;
    this.side = side;
    this.coords = coords;
    this.name = side.name + (index + 1);
    this.maxImprintAreaElementX = 0;
    this.maxImprintAreaElementY = 0;
    this.maxImprintAreaElementW = 0;
    this.maxImprintAreaElementH = 0;
    this.imagesService = imagesService;
  }

  get id(): string {
    return 'design-area-' + this.name;
  }

  get active(): boolean {
    return this.side.active;
  }

  width(): number {
    // convert width in pixels sent by the api to our coordinate system
    return this.coords.w * this.side.scale;
  }

  height(): number {
    // convert height in pixels sent by the api to our coordinate system
    return this.coords.h * this.side.scale;
  }

  top(): number {
    // convert top in pixels sent by the api to our coordinate system
    return this.coords.y;
  }

  bottom(): number {
    return this.top() + this.height();
  }

  get elements(): Element[] { return this._elements; }

  get layers(): Layer[] {
    const elements = [];

    this.elements.slice().reverse().forEach((e) => {
      if (e) {
        if (e.className === 'NamesAndNumbersElement') {
          // N&N should always be "on top"
          elements.unshift(e);
        } else {
          elements.push(e);
        }
      }
    });

    return elements.map((e) => e.toLayer());
  }

  addElement(element: Element): void {
    this._elements.push(element);
  }

  updateElement(element: Element): void {
    this._elements[this.indexOfElement(element)] = element;
  }

  removeElement(element: Element): void {
    this._elements.splice(this.indexOfElement(element), 1);
  }

  moveElementUp(element: Element): void {
    const index = this.indexOfElement(element);
    this.swapElements(index, index + 1);
  }

  moveElementDown(element: Element): void {
    const index = this.indexOfElement(element);
    this.swapElements(index, index - 1);
  }

  writeToSvg(): SVG.Nested {
    if (!this.svgElement) {
      this.svgElement = this.side.svgElement.nested().attr('id', this.id);
    }

    this.svgElement
      .width(this.width())
      .height(this.height())
      .viewbox(0, 0, this.width(), this.height())
    ;

    if (this.side.isSleeve()) {
      this.coords.x = (this.design.svgRoot.viewbox().width / 2) - (this.coords.w / 2);
    }


    if (environment.showPrintAreaOutline) {
      let printAreaOutline = this.svgElement.select('.area-rect').get(0);
      if (!printAreaOutline) {
        printAreaOutline = this.svgElement.rect().addClass('area-rect').style({'stroke': 'black', 'fill': 'none'});
      }
      printAreaOutline.width(this.width()).height(this.height());
    }

    if (this.side.isSleeve()) {
      // NOTE: Usually, we'd set the dimensions of a Side in Side.writeToSvg()
      // but in the case of a sleeve, we wanted it to have the same dimensions as its area, but didn't yet
      // know the area's dimensions... so we're doing it here.
      const sideRect = this.side.svgElement.select('.product-image').get(0);

      if (sideRect) {
        sideRect.width(this.width())
                .height(this.height());
        sideRect.center(this.design.svgRoot.viewbox().width / 2, 200);
      }

      this.svgElement.center(this.design.svgRoot.viewbox().width / 2, 200);

      if (this.maxImprintAreaElementW === 0) {
        this.maxImprintAreaElementW = this.width();
      }
      if (this.maxImprintAreaElementH === 0) {
        this.maxImprintAreaElementH = this.height();
      }
    } else {
        // we place this element at whatever top offset was sent by the api
        this.svgElement.y(this.top());
        // we center this element horizontally, taking into account the xOffset sent by the api
        this.svgElement.cx((this.design.svgRoot.viewbox().width / 2) - (this.coords.x));
    }

    if (!this.maxImprintAreaElement) {
      this.maxImprintAreaElement = this.svgElement.nested().addClass('max-imprint-area');
    }

    this.maxImprintAreaElement
      .width(this.maxImprintAreaElementW)
      .height(this.maxImprintAreaElementH)
      .x(this.maxImprintAreaElementX)
      .y(this.maxImprintAreaElementY)
      .viewbox(0, 0, this.width(), this.maxImprintAreaElementH)
    ;

    let maxImprintBorder = this.maxImprintAreaElement.select('.max-imprint-area-borders').get(0);
    if (!maxImprintBorder) {
      // Add its border
      maxImprintBorder = this.maxImprintAreaElement.rect().addClass('max-imprint-area-borders')
        .style({'stroke': 'red', 'stroke-width': '2px', 'fill': 'none'})
        .hide()
      ;
    }
    maxImprintBorder.width(this.width()).height(this.maxImprintAreaElementH);

    let maxImprintLabel = this.maxImprintAreaElement.select('.max-imprint-area-label').get(0);
    if (!maxImprintLabel) {
      maxImprintLabel = this.maxImprintAreaElement.text('Max Design Area')
        .addClass('max-imprint-area-label')
        .font({size: '32', anchor: 'middle'})
        .style({'stroke': 'white', 'fill': 'black'})
        .attr({'shape-rendering': 'crispEdges'})
        .hide()
      ;
    }
    maxImprintLabel.cx(this.width() / 2).y(-40);

    let distressContainer = this.maxImprintAreaElement.select('.distress-container').get(0);
    if (!distressContainer) {
      distressContainer = this.maxImprintAreaElement.nested().addClass('distress-container');
    }

    this.elements.forEach((e) => {
      if (e.className === 'ImageUploadElement') {
        (e as ImageUploadElement).renderPlaceholder();
        this.imagesService.getImage((e as any).image).subscribe((img) => {
          (e as any).image = img;
          e.render().subscribe();
        });
      } else {
        e.render().subscribe();
      }
    });

    return this.svgElement;
  }

  updateDimensions(areaJson: any) {
    const originW = this.maxImprintAreaElementW;
    const originH = this.maxImprintAreaElementH;
    // const rateX = areaJson.w / this.coords.w
    // const rateY = areaJson.h / this.coords.h
    this.coords = areaJson;

    this.maxImprintAreaElementH = Math.min(15 * this.side.pixelsPerInch, this.height());
    // adjust maxImprintHeightY if necessary so maxImprintArea fits inside area
    if (this.maxImprintAreaElementY + this.maxImprintAreaElementH > this.height()) {
      this.maxImprintAreaElementY = this.height() - this.maxImprintAreaElementH;
    }

    this.maxImprintAreaElementW = this.width();

    let rateX, rateY;
    if(!originW || !originH) {
      rateX = rateY = 1;
    } else {
      // console.log(originW, originH)
      // console.log(this.maxImprintAreaElementW, this.maxImprintAreaElementH)
      rateX = this.maxImprintAreaElementW / originW;
      rateY = this.maxImprintAreaElementH / originH;
    }

    this.elements.forEach(e => e.updateDimensions(rateX, rateY));
  }

  toggleMaxImprintAreaVisibility(show = true) {
    const border = this.maxImprintAreaElement.select('.max-imprint-area-borders').get(0);
    const label = this.maxImprintAreaElement.select('.max-imprint-area-label').get(0);
    if (show) {
      border.show();
      label.show();
    } else {
      border.hide();
      label.hide();
    }
  }

  get maxImprintMovementAllowed(): boolean {
    return !this.elements.find(e => e.className === 'NamesAndNumbersElement');
  }

  get distressContainer(): SVG.Nested {
    return this.svgElement.select('.distress-container').get(0) as SVG.Nested;
  }

  private indexOfElement(element: Element): number {
    return this._elements.findIndex((e) => e.id === element.id);
  }

  private swapElements(a: number, b: number): void {
    const tmp = this._elements[a];
    this._elements[a] = this._elements[b];
    this._elements[b] = tmp;
  }

  elementAt(x, y): Element {
    // translate x/y coords to be relative to the maxImprintAreaElement
    const areaPoint = this.maxImprintAreaElement.point(x, y);
    return this.elements.find(e => e.inside(areaPoint));
  }

  toJson(): object {
    return {
      name: this.name,
      coords: this.coords,
      maxImprintArea: {
        x: this.maxImprintAreaElement.x(),
        y: this.maxImprintAreaElement.y(),
      },
      elements: this.elements.map((e) => e.toJson()),
    };
  }

  fromJson(json: object): void {
    this.name = json['name'];
    this.coords = json['coords'];
    this.maxImprintAreaElementX = json['maxImprintArea'] ? json['maxImprintArea']['x'] : 0;
    this.maxImprintAreaElementY = json['maxImprintArea'] ? json['maxImprintArea']['y'] : 0;
    this._elements = json['elements'].map((e) => {
      return ElementFactory.fromJson(e, this, this.design.colorsService);
    });
  }
}
