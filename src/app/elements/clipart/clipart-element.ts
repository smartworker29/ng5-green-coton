import { Area } from '../../designs/area';
import { Clipart } from './clipart';
import { Color } from '../../colors/color';
import { ColorsService } from '../../colors/colors.service';
import { Element } from '../../element';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import * as SVG from 'svg.js';

const CANVAS_SCALE = 300 / 72.0;

export class ClipartElement extends Element {
  imageElement: SVG.Image;
  private clipartWrapper: SVG.Nested;
  private layersGroup: SVG.G;
  rotationDegreesVirtual = 0;

  static newFromJson(
    json: object,
    area: Area,
    colorsService: ColorsService,
    clipart: Clipart,
  ): ClipartElement {
    const element = new ClipartElement(area, colorsService, clipart);
    element.fromJson(json);
    return element;
  }

  constructor(
    area: Area,
    protected colorsService: ColorsService,
    clipart: Clipart,
  ) {
    super(area);

    this.clipart = clipart;
    this.init();
  }

  private init() {
    if (!this.widthScale) {
      this.widthScale = 1;
    }
    if (!this.heightScale) {
      this.heightScale = 1;
    }
  }

  get fill(): Color { return this.data['fill']; }
  set fill(value: Color) { this.data['fill'] = value; }

  get clipart(): Clipart { return this.data['clipart']; }
  set clipart(value: Clipart) { this.data['clipart'] = value; }

  get widthScale() { return this.data['widthScale']; }
  set widthScale(value: number) { this.data['widthScale'] = value; }

  get heightScale() { return this.data['heightScale']; }
  set heightScale(value: number) { this.data['heightScale'] = value; }

  get originalWidth() { return this.data['originalWidth']; }
  set originalWidth(value: number) { this.data['originalWidth'] = value; }

  get originalHeight() { return this.data['originalHeight']; }
  set originalHeight(value: number) { this.data['originalHeight'] = value; }

  public render(): Observable<void> {
    return Observable.create((observer) => {
      this.initializeSubElements();
      this.renderClipart();

      const self = this;
      this.convertClipartToImage().subscribe((canvas) => {
        const croppedCanvas = this.cropImage(canvas);
        self.imageElement.loaded((loader) => {
          const width = loader.width / CANVAS_SCALE;
          const height = loader.height / CANVAS_SCALE;

          if (self.x === undefined || self.y === undefined) {
            const [cx, cy] = self.defaultPosition();
            self.x = cx - self.width / 2;
            self.y = cy - self.height / 2;
          }

          // clear rotation and then reset it
          this.imageElement.attr('transform', null);
          this.rotationDegreesVirtual = 0;

          self.setWrapperDimensions();

          this.scaleToFit();
          this.moveToFit();

          self.imageElement
            .width(self.width)
            .height(self.height)
          ;

          self.svgElement
            .x(self.x)
            .y(self.y)
            .width(self.width)
            .height(self.height)
            .viewbox(0, 0, self.width, self.height)
          ;

          observer.next();
          observer.complete();
        }).load(croppedCanvas.toDataURL());
      });

    });
  }

  private addBehaviors(): void {
    this.addClickableBehavior();
    this.addDraggableBehavior();
    this.addSelectableBehavior();
    this.addResizableBehavior();
  }

  public colors(): Color[] {
    return _.uniqBy(this.clipart.layers.map((layer) => { return layer.fill; }), 'id');
  }

  // override duplicate so we can also clear imageElement and other attributes
  public duplicate(): Element {
    const newElement = super.duplicate() as ClipartElement;
    newElement.imageElement = null;
    return newElement;
  }

  // overriding because...
  resize(width: number, height: number, keepCentered = true) {
    const oldBox = this.wrapperBox();

    // first, get scale of requested wrapper w/h against current wrapper w/h
    const scaleW = width / this.width;
    const scaleH = height / this.height;

    // then call scale
    this.scale(scaleW, scaleH);
  }

  scale(scaleW: number, scaleH: number) {
    const oldBox = this.wrapperBox();

    const clipartBbox = this.clipartWrapperBbox();
    const currentClipartWidth = clipartBbox.w * this.widthScale;
    const currentClipartHeight = clipartBbox.h * this.heightScale;

    this.widthScale = currentClipartWidth * scaleW / this.originalWidth;
    this.heightScale = currentClipartHeight * scaleH / this.originalHeight;

    const subElementBox = this.subElementBox();
    this.x = oldBox.cx - (subElementBox.width / 2);
    this.y = oldBox.cy - (subElementBox.height / 2);

    this.setWrapperDimensions();
  }

  // overriding because...
  rotate(degrees: number) {
    const oldBox = this.wrapperBox();

    // clear rotation of the image element since it will "contain" the rotation
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

    // keep it centered
    const subElementBox = this.subElementBox();
    this.x = oldBox.cx - (subElementBox.width / 2);
    this.y = oldBox.cy - (subElementBox.height / 2);

    this.setWrapperDimensions();
  }

  protected resizeDoneHandler(e: Event) {
    const oldBox = this.wrapperBox();

    if (this.rotationDegreesVirtual !== null) {
      // this.rotationDegrees = (this.rotationDegreesVirtual + this.rotationDegrees) % 360;
      this.rotationDegreesVirtual = null;
    }

    // Keep it centered
    const subElementBox = this.subElementBox();
    this.x = oldBox.cx - (subElementBox.width / 2);
    this.y = oldBox.cy - (subElementBox.height / 2);

    this.setWrapperDimensions();
    this.updateDimensions();
  }

  get resizableElement(): SVG.Element {
    return this.imageElement;
  }

  get selectableElement(): SVG.Element {
    return this.imageElement;
  }

  protected resizableOptions(): object {
    const options = super.resizableOptions();
    options['getRotation'] = () => this.rotationDegreesVirtual;
    return options;
  }

  public layerDescription(): string {
    return 'Clipart: ' + this.clipart.title;
  }

  get icon(): string {
    return '<img src="' + environment.assetUrl + 'assets/icons/clipart.svg" class="img-fluid" />';
  }

  get className(): string {
    return 'ClipartElement';
  }

  private initializeSubElements(): void {
    if (!this.svgElement) {
      this.svgElement = this.area.distressContainer.nested();
      // preserveAspectRatio must be 'none' so that the clipart inside the svg will stretch to match this svg's viewbox
      this.svgElement.attr('preserveAspectRatio', 'none');

      this.clipartWrapper = this.svgElement.nested()
        .addClass('clipartWrapper')
        .attr('preserveAspectRatio', 'none')
      ;

      this.layersGroup = this.clipartWrapper.group().addClass('layersGroup');

      this.clipart.layers.forEach((layer) => {
        this.layersGroup.svg(layer.svg);
        this.layersGroup.select('svg').last().addClass('layer-' + layer.index);
      });

      const clipartBox = this.subElementBox();
      this.clipartWrapper
        .width(clipartBox.w)
        .height(clipartBox.h)
        .x(clipartBox.x)
        .y(clipartBox.y)
        .viewbox(clipartBox.x, clipartBox.y, clipartBox.w, clipartBox.h)
        .hide()
      ;

      if (!(this.originalWidth || this.originalHeight)) {
        this.originalWidth = clipartBox.w;
        this.originalHeight = clipartBox.h;
      }

      this.imageElement = this.svgElement.image().attr('preserveAspectRatio', 'none');

      this.addBehaviors();
    }

    if (!this.id) {
      this.id = this.svgElement.attr('id');
    }
  }

  private renderClipart(): void {
    this.layersGroup.attr('transform', null);

    const productColorRgb = this.area.design.productColor.swatch();
    const self = this;
    this.clipart.layers.forEach((layer) => {
      const layerElement = this.svgElement.select('.layer-' + layer.index).first();
      // TODO: better way to write this?
      layerElement.each(function(i, children) {
        if(!self.isIE())
          this.style('fill', null);
        if (layer.fill.id === 'GARMENT_COLOR') {
          layer.fill.rgb = productColorRgb;
        }
        this.fill(layer.fill.rgb);
      }, true)[0];
    });

    if (!this.width || !this.height) {
      const bbox = this.clipartWrapperBbox();
      this.width = bbox.w;
      this.height = bbox.h;
    }
  }

  accurateBoundingBox(): SVG.Box {
    const scaleMatrix = new SVG.Matrix()
      .scale(this.widthScale, this.heightScale)
      .rotate(this.rotationDegrees)
    ;
    return this.clipartWrapperBbox().transform(scaleMatrix);
  }

  private clipartWrapperBbox(): SVG.BBox {
    if (this.clipartWrapper) {
      this.clipartWrapper.show();
      const bbox = this.clipartWrapper.bbox();
      this.clipartWrapper.hide();
      return bbox;
    }
    return new SVG.BBox();
  }

  public remove() {
    super.remove();
    if (this.clipartWrapper) {
      this.clipartWrapper.remove();
    }
  }

  isIE() {
    var ua = navigator.userAgent;
    /* MSIE used to detect old browsers and Trident used to newer ones*/
    var is_ie = ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;

    return is_ie;
  }

  private convertClipartToImage(): Observable<HTMLCanvasElement> {
    return Observable.create((observer) => {
      // temporarily show paths and hide image
      this.clipartWrapper.show();
      this.imageElement.hide();

      const bbox = this.clipartWrapper.bbox();
      const bboxWidth = bbox.width * CANVAS_SCALE;
      const bboxHeight = bbox.height * CANVAS_SCALE;

      const radians = this.rotationDegrees * Math.PI / 180;
      const width = bboxHeight * Math.abs(Math.sin(radians)) + bboxWidth * Math.abs(Math.cos(radians));
      const height = bboxHeight * Math.abs(Math.cos(radians)) + bboxWidth * Math.abs(Math.sin(radians));

      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      canvas.width = width;
      canvas.height = height;
      canvas.classList.add('clipartCanvas');

      const context = canvas.getContext('2d');
      context.translate(width / 2, height / 2);
      context.rotate(radians);

      const clipartClone = this.clipartWrapper.node.cloneNode(true) as SVGElement;
      if (this.flipAxis === 'y') {
        context.scale(1, -1);
      } else if (this.flipAxis === 'x') {
        context.scale(-1, 1);
      }

      // We build a separate svg element we can use to hold the textPath of text so we can load it as an image
      const svgDoc = this.area.design.svgRoot.node.cloneNode() as SVGElement;
      svgDoc.setAttribute('id', 'clipartCanvas');
      svgDoc.setAttribute('width', canvas.width.toString());
      svgDoc.setAttribute('height', canvas.height.toString());
      svgDoc.setAttribute('preserveAspectRatio', 'none');
      svgDoc.appendChild(clipartClone);
      svgDoc.setAttribute('viewBox', bbox.x + ' ' + bbox.y + ' ' + bbox.w + ' ' + bbox.h);

      this.clipartWrapper.hide();
      this.imageElement.show();

      if (this.isIE()) {
        let html = '<svg ';
        for(var i = 0; i < svgDoc.attributes.length; i++) {
          if (svgDoc.attributes[i].name != 'xmlns') {
            html += `${svgDoc.attributes[i].name}="${svgDoc.attributes[i].value}" `;
          }
        }
        html += `>${clipartClone.outerHTML}</svg>`
        html = html.replace ('xmlns="http://www.w3.org/2000/svg" ', ' ') ;
        html = html.replace ('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ') ;
        html = '<?xml version="1.0" encoding="UTF-8" ?>' + html;
        const formData = new FormData();
        formData.append('data', 'data:image/svg+xml;base64,' + btoa(html));
        const req = new XMLHttpRequest();
        req.open('POST', environment.apiBaseUrl + '/api/v1/svg');
        req.onload = function(e) {
          const svgImg = new Image();
          svgImg.src = req.responseText;
          svgImg.onload = function() {
            context.drawImage(svgImg, -bboxWidth / 2, -bboxHeight / 2, bboxWidth, bboxHeight);
            observer.next(canvas);
            observer.complete();
          };
          svgImg.onerror = function(err) {
            console.error('error loading svgImg: %o', err);
            observer.error(new Error('error loading svgImg: ' + err));
          };
        };
        req.send(formData);
      } else {
        const svgImg = new Image();
        svgImg.onload = () => {
          context.drawImage(svgImg, -bboxWidth / 2, -bboxHeight / 2, bboxWidth, bboxHeight);
          observer.next(canvas);
          observer.complete();
        };
        svgImg.onerror = (err) => {
          console.error('error loading svgImg: %o', err);
          observer.error(new Error('error loading svgImg: ' + err));
        };
        svgImg.src = 'data:image/svg+xml;base64,' + btoa(svgDoc.outerHTML);
      }
    });
  }


  private cropImage(canvas: HTMLCanvasElement): HTMLCanvasElement {
    // get the tight bounding box of the shaped text on the canvas
    const context = canvas.getContext('2d');
    const bbox = this.canvasBoundingBox(context, 0, 0, canvas.width, canvas.height);

    const cropCanvasWidth = bbox.width;
    const cropCanvasHeight = bbox.height;

    const cropCanvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
    cropCanvas.width = cropCanvasWidth;
    cropCanvas.height = cropCanvasHeight;
    cropCanvas.classList.add('crop-canvas');

    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(canvas, bbox.minX, bbox.minY, bbox.width, bbox.height, 0, 0, cropCanvas.width, cropCanvas.height);

    return cropCanvas;
  }

  private canvasBoundingBox(ctx: CanvasRenderingContext2D, left = 0, top = 0, width = 0, height = 0): any {
    const bbox = { minX: null, minY: null, maxX: null, maxY: null, width: null, height: null, imageData: null };

    // get the imagedata from the canvas with the shaped text on it
    const imageData: ImageData = ctx.getImageData(left, top, width, height);

    // Get maxY by scanning side-to-side starting from the bottom-right and breaking as soon as we see something in the pixel
    for (let y = imageData.height - 1; y >= 0; y--) {
      for (let x = imageData.width - 1; x >= 0; x--) {
        if (imageData.data[(imageData.width * y + x) * 4 + 3]) {
          bbox.maxY = y;
          break;
        }
      }
      if (bbox.maxY !== null) {
        break;
      }
    }

    // Get maxX by scanning up-and-down starting from the top-right and breaking as soon as we see a pixel
    for (let x = imageData.width - 1; x >= 0; x--) {
      for (let y = 0; y <= bbox.maxY; y++) {
        if (imageData.data[(imageData.width * y + x) * 4 + 3]) {
          bbox.maxX = x;
          break;
        }
      }
      if (bbox.maxX !== null) {
        break;
      }
    }

    // Get minX by scanning up-and-down starting from the left and breaking as soon as we see a pixel
    for (let x = 0; x <= bbox.maxX; x++) {
      for (let y = 0; y <= bbox.maxY; y++) {
        if (imageData.data[(imageData.width * y + x) * 4 + 3]) {
            bbox.minX = x;
            break;
        }
      }
      if (bbox.minX !== null) {
        break;
      }
    }

    // Get minY by scanning side-to-side starting from the top and breaking as soon as we see a pixel
    for (let y = 0; y <= bbox.maxY; y++) {
      for (let x = 0; x <= bbox.maxX; x++) {
        if (imageData.data[(imageData.width * y + x) * 4 + 3]) {
          bbox.minY = y;
          break;
        }
      }
      if (bbox.minY !== null) {
        break;
      }
    }

    bbox.width = bbox.maxX - bbox.minX + 1;
    bbox.height = bbox.maxY - bbox.minY + 1;
    return bbox;
 }
};
