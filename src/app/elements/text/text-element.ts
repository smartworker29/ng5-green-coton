import { Area } from '../../designs/area';
import { Color } from '../../colors/color';
import { DesignsService } from '../../designs/designs.service';
import { Element } from '../../element';
import { environment } from '../../../environments/environment';
import { Font } from '../../ui/font.interfaces';
import { Observable } from 'rxjs/Observable';
import { Outline } from './effects/outline';
import { TextShapeFactory } from './effects/text-shape/factory';
import { TextShapeType } from './effects/text-shape/text-shape-type';
import * as opentype from 'opentype.js/dist/opentype.js';
import * as SVG from 'svg.js';
const SVGBoundings = require('svg-boundings');

const CANVAS_SCALE = 600 / 72.0;

export class TextElement extends Element {
  editing = false;
  imageElement: SVG.Image;
  keepDimensions = false;
  textPathsContainer: SVG.Nested;
  textPathsWidth = 0;
  textPathsHeight = 0;
  textPaths: SVG.Nested;
  dropShadowPaths: SVG.Nested;
  shapeType: TextShapeType;
  textChanged = false;
  rotationDegreesVirtual = 0;
  private defaultText = 'Enter text';

  static newFromJson(json: object, area: Area): TextElement {
    const element = new TextElement(area);
    element.fromJson(json);
    element.init();
    element.font = Font.fromJson(element.font);
    element.fill = Color.fromJson(element.fill);
    element.textChanged = true; // NOTE: needed to trigger rendering of text with font
    element.keepDimensions = true;
    return element;
  }

  constructor(area: Area) {
    super(area);

    this.text = this.defaultText;
    this.letterSpacing = 0;
    this.shapeAdjust = 75;
    this.shapeName = 'plain';
    this.init();
  }

  private init() {
    if (!this.widthScale || this.widthScale === 0) {
      this.widthScale = 1;
    }
    if (!this.heightScale) {
      this.heightScale = 1;
    }
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

  // override duplicate so we can also clear imageElement and other attributes
  public duplicate(): Element {
    const newElement = super.duplicate() as TextElement;
    newElement.imageElement = null;
    newElement.textChanged = true;
    newElement.keepDimensions = true;
    return newElement;
  }

  get text() { return this.data['text']; }
  set text(value) { this.data['text'] = value; }

  get font(): Font { return this.data['font']; }
  set font(value: Font) { this.data['font'] = value; }

  get fill() { return this.data['fill']; }
  set fill(value: Color) { this.data['fill'] = value; }

  get letterSpacing() { return this.data['letterSpacing']; }
  set letterSpacing(value: number) { this.data['letterSpacing'] = value; }

  get lineSpacing() { return this.data['lineSpacing']; }
  set lineSpacing(value: number) { this.data['lineSpacing'] = value; }

  get widthScale() { return this.data['widthScale']; }
  set widthScale(value: number) { this.data['widthScale'] = value; }

  get heightScale() { return this.data['heightScale']; }
  set heightScale(value: number) { this.data['heightScale'] = value; }

  get shapeAdjust(): number { return this.data['shapeAdjust']; }
  set shapeAdjust(value: number) { this.data['shapeAdjust'] = value; }

  get shapeName(): string { return this.data['shapeName']; }
  set shapeName(value: string) { this.data['shapeName'] = value; }

  get originalWidth() { return this.data['originalWidth']; }
  set originalWidth(value: number) { this.data['originalWidth'] = value; }

  get originalHeight() { return this.data['originalHeight']; }
  set originalHeight(value: number) { this.data['originalHeight'] = value; }

  public render(): Observable<void> {
    this.initializeSubElements();

    if (!this.textChanged) {
      return this._render();
    }

    this.textChanged = false;

    return Observable.create((observer) => {

      opentype.load(this.font.url, (err, font) => {

        if (err) {
          console.error('couldn\'t load font: ' + err);

        } else {
          this.loadTextPaths(font);

          this._render().subscribe(() => {
            observer.next();
            observer.complete();
          });
        }
      });
    });
  }

  private _render(): Observable<void> {
    return Observable.create((observer) => {
      if (this.fill.id === 'GARMENT_COLOR') {
        this.fill.rgb = this.area.design.productColor.swatch();
      }
      this.textPaths.fill(this.fill.rgb);

      this.rebuildEnabledEffects();

      this.textPaths.front();

      if (!this.width || !this.height) {
        this.width = this.textPathsWidth;
        this.height = this.textPathsHeight;
      }

      this.convertTextToImage().subscribe((imageData) => {

        this.imageElement.loaded((loader) => {

          const width = loader.width / CANVAS_SCALE;
          const height = loader.height / CANVAS_SCALE;

          if (this.x === undefined || this.y === undefined) {
            const [cx, cy] = this.defaultPosition();
            this.x = cx - this.width / 2;
            this.y = cy - this.height / 2;
          }

          // clear rotation and then reset it
          this.imageElement.attr('transform', null);
          this.rotationDegreesVirtual = 0;

          this.imageElement
            .width(this.width)
            .height(this.height)
          ;

          this.setWrapperDimensions();

          this.scaleToFit();
          this.moveToFit();

          this.svgElement
            .x(this.x)
            .y(this.y)
            .width(this.width)
            .height(this.height)
            .viewbox(0, 0, this.width, this.height)
          ;

          observer.next();
          observer.complete();
        }).load(imageData);
      });
    });
  }

  // override since we don't actually want to rotate the image, but rather the text when it's placed on the image
  rotate(degrees: number) {
    const oldBox = this.wrapperBox();

    // clear rotation of the image element
    this.resizableElement.attr('transform', null);

    if (this.resizing) {
      // we're manually rotating, so we have to do some trickery to allow immediate rotation of the rendered image, but
      // then keep set the right value so the image is rendered with rotated content
      const deltaDegrees = degrees - this.rotationDegreesVirtual;
      this.rotationDegrees = (this.rotationDegrees + deltaDegrees) % 360;
      if(this.rotationDegrees < 0)
        this.rotationDegrees += 360;
      this.rotationDegreesVirtual = degrees;
      this.resizableElement.transform({ rotation: this.rotationDegreesVirtual }, true);
    } else {
      // we're rotating via the precision controls (or programatically)
      const deltaDegrees = degrees - this.rotationDegrees;
      this.resizableElement.transform({ rotation: deltaDegrees }, true);
      this.rotationDegrees = degrees;
    }

    // Keep it centered
    const subElementBox = this.subElementBox();
    this.x = oldBox.cx - (subElementBox.width / 2);
    this.y = oldBox.cy - (subElementBox.height / 2);

    this.setWrapperDimensions();
  }

  // override so we can keep track of width/height scale instead of resizing subElement
  resize(width: number, height: number, keepCentered = true) {
    // first, get scale of requested wrapper w/h against current wrapper w/h
    const scaleW = width / this.width;
    const scaleH = height / this.height;

    // then call scale
    this.scale(scaleW, scaleH);
  }

  // override so we can keep track of width/height scale instead of resizing subElement
  scale(scaleW: number, scaleH: number) {
    const oldBox = this.wrapperBox();

    const textBbox = this.textPathsContainerBbox();
    const currentTextWidth = textBbox.w * this.widthScale;
    const currentTextHeight = textBbox.h * this.heightScale;

    const savedWidth = this.widthScale;
    const savedHeight = this.heightScale;

    this.widthScale = currentTextWidth * scaleW / this.originalWidth;
    if (this.widthScale === 0) {
      this.widthScale = savedWidth;
    }
    this.heightScale = currentTextHeight * scaleH / this.originalHeight;
    if (this.heightScale === 0) {
      this.heightScale = savedHeight;
    }

    const subElementBox = this.subElementBox();
    this.x = oldBox.cx - (subElementBox.width / 2);
    this.y = oldBox.cy - (subElementBox.height / 2);

    this.setWrapperDimensions();
  }

  protected resizeDoneHandler(e: Event) {
    const oldBox = this.wrapperBox();

    if (this.rotationDegreesVirtual !== null) {
      // this.rotationDegrees = this.rotationDegreesVirtual + this.rotationDegrees;
      this.rotationDegreesVirtual = null;
    }

    // Keep it centered
    const subElementBox = this.subElementBox();
    this.x = oldBox.cx - (subElementBox.width / 2);
    this.y = oldBox.cy - (subElementBox.height / 2);

    this.setWrapperDimensions();
    this.updateDimensions();
  }

  public fonts(): Font[] {
    return [this.font];
  }

  // Outline #2 needs to know first outline's width so it can add it to its offset
  public get first_outline_width(): number {
    const outlineOneEffect = this.getEffect('Outline') as Outline;
    if (outlineOneEffect && outlineOneEffect.enabled) {
      return outlineOneEffect.thickness;
    }
    return 0;
  }

  protected layerDescription(): string {
    return this.text.length > 10 ? this.text.substring(0, 10) + '...' : this.text;
  }

  get icon(): string {
    return '<img src="' + environment.assetUrl + 'assets/icons/text.svg" class="img-fluid" />';
  }

  get className(): string {
    return 'TextElement';
  }

  private convertTextToImage(): Observable<string> {
    this.shapeType = TextShapeFactory.build(this.shapeName);
    this.shapeType.adjust = this.shapeAdjust;
    this.shapeType.element = this;
    this.shapeType.highResScale = CANVAS_SCALE;
    return this.shapeType.createImage();
  }

  protected get subElement(): any {
    return this.imageElement;
  }

  get selectableElement(): SVG.Element {
    return this.imageElement;
  }

  get resizableElement(): SVG.Element {
    return this.imageElement;
  }

  protected resizableOptions(): object {
    const options = super.resizableOptions();
    options['getRotation'] = () => this.rotationDegreesVirtual;
    return options;
  }

  accurateBoundingBox(): SVG.Box {
    const scaleMatrix = new SVG.Matrix()
      .scale(this.widthScale, this.heightScale)
      .rotate(this.rotationDegrees)
    ;
    return this.textPathsContainerBbox().transform(scaleMatrix);
  }

  private initializeSubElements(): void {
    if (!this.svgElement) {
      this.svgElement = this.area.distressContainer.nested()
        .attr('preserveAspectRatio', 'none')
        .addClass('elementWrapper')
      ;
    }

    if (!this.imageElement) {
      this.imageElement = this.svgElement.image().attr('preserveAspectRatio', 'none');
      this.addClickableBehavior();
      this.addDraggableBehavior();
      this.addResizableBehavior();
      this.addSelectableBehavior();
    }

    if (!this.textPathsContainer) {
      this.textPathsContainer = this.area.maxImprintAreaElement.nested().addClass('textPathsContainer').hide();
      this.textPaths = this.textPathsContainer.nested().addClass('textPaths');
      this.textPathsContainer.add(this.textPaths);
    }

    if (!this.id) {
      this.id = this.svgElement.attr('id');
    }
  }

  private loadTextPaths(font: any): void {

    // do some math based on this font and the fontSize
    const fontSize = 2 * this.area.side.pixelsPerInch;
    const fontAscender = fontSize * (font.ascender / font.unitsPerEm);
    const fontDescender = fontSize * (font.descender / font.unitsPerEm);
    const lineHeight = fontAscender - fontDescender;
    if (!this.lineSpacing) {
      this.lineSpacing = lineHeight;
    }

    // Re-generating text, so remove text path commands
    this.textPaths.clear();

    // We don't want to attempt to render blank text.. but at the same time we don't want to reset this.text
    // to the default when the user is clearing the input field.. as that will frustrate the user
    let renderableText = this.defaultText;
    if (this.text !== '') {
      renderableText = this.text;
    }

    renderableText.split(/\n/).forEach((line, i) => {
      // TODO: don't ignore font's default lineSpacing... use ours as a multiplying factor
      const path = font.getPath(line, 0, i * this.lineSpacing, fontSize, {
        letterSpacing: this.letterSpacing / fontSize
      });

      this.textPaths.add(new SVG.Path().plot(path.toPathData()));
    });

    const bbox = this.textPathsContainerBbox();
    this.textPathsWidth = bbox.w;
    this.textPathsHeight = bbox.h;

    if (!(this.originalWidth || this.originalHeight)) {
      this.originalWidth = this.width;
      this.originalHeight = this.height;
    }

    // Because the text content is changing, we want to change the width/height of the element
    // But when first loading from a saved design, we want to keep the dimensions we had
    if (this.keepDimensions) {
      this.keepDimensions = false;
    } else {
      this.originalWidth = bbox.w;
      this.originalHeight = bbox.h;
    }

    // Now that we know the overall width, we'll center each line
    const width = bbox.w;
    this.textPathsContainer.show();
    this.textPaths.children().forEach((path) => {
      path.translate((width / 2) - (path.bbox().w / 2), 0);
    });
    this.textPathsContainer.hide();
  }

  private textPathsContainerBbox(): SVG.BBox {
    if (this.textPathsContainer) {
      this.textPathsContainer.show();
      if (this.dropShadowPaths) {
        this.dropShadowPaths.hide();
      }
      const bbox = this.textPathsContainer.bbox();
      if (this.dropShadowPaths) {
        this.dropShadowPaths.show();
      }
      this.textPathsContainer.hide();
      return bbox;
    }
    return new SVG.BBox();
  }

  public remove() {
    super.remove();
    if (this.textPathsContainer) {
      this.textPathsContainer.remove();
    }
  }
};
