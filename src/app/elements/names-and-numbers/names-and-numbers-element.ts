import { Area } from '../../designs/area';
import { Color } from '../../colors/color';
import { DesignsService } from '../../designs/designs.service';
import { Element } from '../../element';
import { Font } from '../../ui/font.interfaces';
import { Layer } from '../../elements/layers/layer';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import * as opentype from 'opentype.js/dist/opentype.js';
import * as SVG from 'svg.js';

const NAME_HEIGHT_INCHES = 2;
const NUMBER_HEIGHT_INCHES = 7;
const NUMBER_TOP_INCHES = 5;
const MAX_WIDTH_INCHES = 13;

export class NamesAndNumbersElement extends Element {
  public nameElement: any;
  public nameElementWrapper: any;
  public numberElement: any;
  public numberElementWrapper: any;

  static newFromJson(json: object, area: Area): NamesAndNumbersElement {
    const element = new NamesAndNumbersElement(area);
    element.fromJson(json);
    element.nameFont = Font.fromJson(element.nameFont);
    element.numberFont = Font.fromJson(element.numberFont);
    return element;
  }

  constructor(area: Area) {
    super(area);

    this.nameText = 'NAME GOES HERE';
    this.numberText = '00';
    [this.x, this.y] = this.defaultPosition();
  }

  get nameText() { return this.data['nameText']; }
  set nameText(value) { this.data['nameText'] = value; }

  get nameFont(): Font { return this.data['nameFont']; }
  set nameFont(value: Font) { this.data['nameFont'] = value; }

  get nameFill() { return this.data['nameFill']; }
  set nameFill(value) { this.data['nameFill'] = value; }

  get numberText() { return this.data['numberText']; }
  set numberText(value) { this.data['numberText'] = value; }

  get numberFont(): Font { return this.data['numberFont']; }
  set numberFont(value: Font) { this.data['numberFont'] = value; }

  get numberFill() { return this.data['numberFill']; }
  set numberFill(value) { this.data['numberFill'] = value; }

  public render(): Observable<void> {
    this.initializeSubElements();

    const renderTasks = [this.renderName(), this.renderNumber()];
    return Observable.create((observer) => {
      Observable.forkJoin(...renderTasks).subscribe(() => {
        observer.next();
        observer.complete();
      });
    });
  }

  private initializeSubElements(): void {
    if (!this.svgElement) {

      this.svgElement = this.area.maxImprintAreaElement.nested()
        .addClass('names-and-numbers-wrapper')
        .width(MAX_WIDTH_INCHES * this.area.side.pixelsPerInch)
        .cx(this.x)
      ;

      this.nameElementWrapper = this.svgElement.nested()
        .addClass('name-wrapper')
        .attr('preserveAspectRatio', 'none')
        .height(NAME_HEIGHT_INCHES * this.area.side.pixelsPerInch)
      ;
      this.nameElement = new SVG.Path();
      this.nameElementWrapper.add(this.nameElement);

      this.numberElementWrapper = this.svgElement.nested()
        .addClass('number-wrapper')
        .height(NUMBER_HEIGHT_INCHES * this.area.side.pixelsPerInch)
      ;
      this.numberElement = new SVG.Path();
      this.numberElementWrapper.add(this.numberElement);

      this.addClickableBehavior();
      this.addSelectableBehavior();
    }

    if (!this.id) {
      this.id = this.svgElement.attr('id');
    }

  }

  private renderName(): Observable<void> {
    return Observable.create((observer) => {

      const productColorRgb = this.area.design.productColor.swatch();

      opentype.load(this.nameFont.url, (err, font) => {
        if (err) {
          console.error('couldn\'t load font: ' + err);
          observer.error('couldn\'t load font: ' + err);
        } else {
          const nameSize = NAME_HEIGHT_INCHES * this.area.side.pixelsPerInch;
          const path = font.getPath(this.nameText, 0, 0, nameSize);
          this.nameElement.plot(path.toPathData());

          // bbox is the bounding box from an internal perspective
          const bbox = this.nameElement.bbox();

          const nameY = this.nameElementWrapper.height();
          this.nameElementWrapper
            .x(Math.max(0, this.svgElement.width() / 2 - bbox.width / 2))
            .y(nameY)
            .width(Math.min(this.svgElement.width(), bbox.width))
            .height(nameY)
            .viewbox(0, 0, bbox.width, bbox.height)
          ;

          if (this.nameFill.id === 'GARMENT_COLOR') {
            this.nameFill.rgb = productColorRgb;
          }
          this.nameElement.fill(this.nameFill.rgb);

          observer.next();
          observer.complete();
        }
      });
    });
  }

  private renderNumber(): Observable<void> {
    return Observable.create((observer) => {

      const productColorRgb = this.area.design.productColor.swatch();

      opentype.load(this.numberFont.url, (err, font) => {
        if (err) {
          console.error('couldn\'t load font: ' + err);
          observer.error('couldn\'t load font: ' + err);
        } else {
          const path = font.getPath(this.numberText);
          this.numberElement.plot(path.toPathData());

          const bbox = this.numberElement.bbox();

          const numberY = NUMBER_TOP_INCHES * this.area.side.pixelsPerInch + this.numberElementWrapper.height();

          this.numberElementWrapper
            .y(numberY)
            .viewbox(0, 0, bbox.width, bbox.height)
          ;

          if (this.numberFill.id === 'GARMENT_COLOR') {
            this.numberFill.rgb = productColorRgb;
          }
          this.numberElement.fill(this.numberFill.rgb);

          observer.next();
          observer.complete();
        }
      });
    });
  }

  public colors(): Color[] {
    // NOTE: names & numbers don't count for "colors on a side"
    return [this.nameFill, this.numberFill];
  }

  public fonts(): Font[] {
    return [this.nameFont, this.numberFont];
  }

  public layerDescription(): string {
    return 'Names and Numbers';
  }


  get icon(): string {
    return '<i class="fa fa-users"></i>';
  }

  get className(): string {
    return 'NamesAndNumbersElement';
  }

  protected allowResize(): boolean {
    return false;
  }

  protected allowRotate(): boolean {
    return false;
  }

  // Overriding because N&N Colors shouldn't count towards "colors on a side"
  public toLayer(): Layer {
    const layer = new Layer();
    layer.id = this.id;
    layer.description = this.layerDescription();
    layer.elementReference = this;
    layer.colors = [];
    layer.weight = 99;
    return layer;
  }

  accurateBoundingBox(): SVG.Box {
    const nameBox = this.nameElementWrapper.rbox(this.area.maxImprintAreaElement);
    const numberBox = this.numberElementWrapper.rbox(this.area.maxImprintAreaElement);
    return nameBox.merge(numberBox);
  }
}
