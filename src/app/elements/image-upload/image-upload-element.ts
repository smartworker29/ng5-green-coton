import { Area } from '../../designs/area';
import { Color } from '../../colors/color';
import { Element } from '../../element';
import { Image } from '../../images/image';
import { ImagesService } from '../../images/images.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/Observable';
import { BlackAndWhite } from './print-methods/black-and-white';
import { SingleColor } from './print-methods/single-color';
import { MultiColors } from './print-methods/multi-colors';
import * as SVG from 'svg.js';
const SVGBoundings = require('svg-boundings');

const CANVAS_SCALE = 300 / 72.0;

export class ImageUploadElement extends Element {
  private imageElement: any;
  convertedImage: Image;
  originImageData: any;

  static newFromJson(json: object, area: Area, image: Image): ImageUploadElement {
    const element = new ImageUploadElement(area, image);
    element.fromJson(json);
    element.imageColors = json['data']['colors'].map((c) => Color.fromJson(c));
    element.image = Image.fromJson(element.image);
    element.init();
    return element;
  }

  constructor(area: Area, image: Image) {
    super(area);
    this.image = image;
    this.threshold = 364;
    this.imageColors = [];
    this.image = image;
    this.init();
  }

  private init() {
    this.convertedImage = new Image();
    if (this.imageWidth && this.imageHeight) {
      this.convertedImage.width = this.imageWidth;
      this.convertedImage.height = this.imageHeight;
    } else if (this.image) {
      this.convertedImage.width = this.image.width;
      this.convertedImage.height = this.image.height;
    }
  }

  get printMethod(): string { return this.data['printMethod']; }
  set printMethod(value: string) { this.data['printMethod'] = value; }

  get imageColors(): Color[] { return this.data['colors']; }
  set imageColors(value: Color[]) { this.data['colors'] = value; }

  get transparentColor(): Color { return this.data['transparentColor']; }
  set transparentColor(value: Color) { this.data['transparentColor'] = value; }

  get image(): Image { return this.data['image']; }
  set image(value: Image) { this.data['image'] = value; }

  get imageWidth(): number { return this.data['imageWidth']; }
  set imageWidth(value: number) { this.data['imageWidth'] = value; }

  get imageHeight(): number { return this.data['imageHeight']; }
  set imageHeight(value: number) { this.data['imageHeight'] = value; }

  get threshold(): number { return this.data['threshold']; }
  set threshold(value: number) { this.data['threshold'] = +value; }

  public renderPlaceholder(): void {
    // Not sure if this is good but because the "order" of layers is basically just the
    // order in the json then slow loading elements such as images will need to render their
    // svg wrapper to "hold their place" in the stack and not just appear on top
    this.initializeSubElements();
  }

  public render(): Observable<void> {
    return Observable.create((observer) => {
      this.initializeSubElements();
      this.downsizeImageIfTooBigForArea().subscribe(() => {
        this.convertImage().subscribe(() => {
          this.imageElement.loaded((loader) => {
            this.imageWidth = this.convertedImage.width;
            this.imageHeight = this.convertedImage.height;

            if (!this.width || !this.height) {
              this.width = this.imageWidth;
              this.height = this.imageHeight;
            }

            if (this.x === undefined || this.y === undefined) {
              const [cx, cy] = this.defaultPosition();
              const bbox = this.svgElement.bbox();
              this.x = cx - this.width / 2 - bbox.x;
              this.y = cy - this.height / 2 - bbox.y;
            }

            this.imageElement
              .attr('transform', null)
              .transform({ rotation: this.rotationDegrees }, true)
              .width(this.imageWidth)
              .height(this.imageHeight)
            ;

            this.setWrapperDimensions();
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
          }).load(this.convertedImage.dataUrl);
        });
      });
    });
  }

  private initializeSubElements(): void {
    if (!this.svgElement) {
      this.svgElement = this.area.distressContainer.nested();
      this.svgElement.attr('preserveAspectRatio', 'xMinYMin');

      if (!this.id) {
        this.id = this.svgElement.attr('id');
      }

      this.imageElement = this.svgElement.image();
      this.imageElement.attr('preserveAspectRatio', 'none');

      this.addClickableBehavior();
      this.addDraggableBehavior();
      this.addSelectableBehavior();
      this.addResizableBehavior();
    }
  }

  private convertImage(): Observable<void> {
    return Observable.create((observer) => {
      switch (this.printMethod) {
        case 'single':
          SingleColor.convert(this, this.threshold).subscribe((convertedImage) => {
            this.convertedImage = convertedImage;
            observer.next();
            observer.complete();
          });
          break;
        case 'multi':
          MultiColors.convert(this, this.transparentColor, 30).subscribe((convertedImage) => {
            this.convertedImage = convertedImage;
            observer.next();
            observer.complete();
          });
          break;
        case 'color': {
            this.convertedImage.filename = 'c-' + this.image.filename;
            observer.next();
            observer.complete();
            break;
          }
        case 'blackAndWhite':
          BlackAndWhite.convert(this).subscribe((convertedImage) => {
            this.convertedImage = convertedImage;
            observer.next();
            observer.complete();
          });
          break;
      }
    });
  }

  private downsizeImageIfTooBigForArea(): Observable<void> {
    return Observable.create((observer) => {
      // TODO: if newWidth and newHeight same as current w/h, then return early...

      // First, calculate what width/height should be (if either are too big for area)
      let newWidth = this.convertedImage.width;
      let newHeight = this.convertedImage.height;

      if (this.convertedImage.dataUrl != null && (newWidth <= this.area.svgElement.width() && newHeight < this.area.svgElement.height())) {
        observer.next();
        observer.complete();
        return;
      }

      if (newWidth > this.area.svgElement.width()) {
        const scale = this.area.svgElement.width() / newWidth;
        newWidth = this.area.svgElement.width();
        newHeight = scale * newHeight;
      }
      if (newHeight > this.area.svgElement.height()) {
        const scale = this.area.svgElement.height() / newHeight;
        newHeight = this.area.svgElement.height();
        newWidth = scale * newWidth;
      }

      // then create a canvas to create a high-res, smaller version of image
      const canvas = document.createElement('canvas');
      canvas.width = newWidth * CANVAS_SCALE;
      canvas.height = newHeight * CANVAS_SCALE;
      const context = canvas.getContext('2d');

      const newImg = document.createElement('img');
      newImg.width = newWidth;
      newImg.height = newHeight;
      newImg.onload = () => {
        context.drawImage(newImg, 0, 0, canvas.width, canvas.height);

        // set our main image's new width, height, and dataUrl
        this.convertedImage.width = newWidth;
        this.convertedImage.height = newHeight;
        this.convertedImage.dataUrl = canvas.toDataURL();
        observer.next();
        observer.complete();
      };
      newImg.src = this.image.dataUrl;
    });
  }

  public colors(): Color[] {
    return this.imageColors;
  }

  public layerDescription(): string {
    let filename = this.image.filename;

    if (filename.length >= 20) {
      filename = filename.slice(0, 16) + '...';
    }

    return 'Image Upload: ' + filename;
  }

  get icon(): string {
    return '<img src="' + environment.assetUrl + 'assets/icons/image-upload.svg" class="img-fluid" />';
  }

  protected resizeDoneHandler(e: Event) {
    this.setWrapperDimensions();
    this.updateDimensions();
  }

  get className(): string {
    return 'ImageUploadElement';
  }

  toJson(): object {
    const json = super.toJson();

    if (json['data']['image']) {
      delete json['data']['image']['dataUrl'];
    }

    if (json['data']['convertedImage']) {
      delete json['data']['convertedImage']['dataUrl'];
    }

    return json;
  }

  protected resizableOptions(): object {
    return {
      snapToAngle: 1,
      designElement: this,
      preserveAspectRatio: true,
      renderDuringResize: false,
    };
  }

  accurateBoundingBox(): SVG.Box {
    const bbox = new SVG.BBox();
    const accurateBox = SVGBoundings.image(this.imageElement.node, true);
    bbox.x = accurateBox.left;
    bbox.y = accurateBox.top;
    bbox.w = bbox.width = accurateBox.width;
    bbox.h = bbox.height = accurateBox.height;
    return bbox;
  }

  get resizableElement(): SVG.Element {
    return this.imageElement;
  }

  get selectableElement(): SVG.Element {
    return this.imageElement;
  }

  rotate(degrees: number) {
    const oldBox = this.wrapperBox();

    // clear rotation of the image element
    this.resizableElement.attr('transform', null);

    this.rotationDegrees = degrees % 360;
    if(this.rotationDegrees < 0)
      this.rotationDegrees += 360;
    this.resizableElement.transform({ rotation: this.rotationDegrees }, true);

    // Keep it centered
    const subElementBox = this.subElementBox();
    this.x = oldBox.cx - (subElementBox.width / 2);
    this.y = oldBox.cy - (subElementBox.height / 2);

    this.setWrapperDimensions();
  }

  // override so we can keep track of width/height scale instead of resizing subElement
  resize(width: number, height: number, keepCentered = true) {
    // first, get scale of requested wrapper w/h against current wrapper w/h
    let scaleW, scaleH

    scaleW = width / this.convertedImage.width;
    scaleH = height / this.convertedImage.height;

    const maxWidth = this.area.maxImprintAreaElementW;
    if(this.width > maxWidth) {
      scaleW = width / this.width;
      scaleH = height / this.height;
    }

    // then call scale
    this.scale(scaleW, scaleH);
    this.updateDimensions();
  }

  scale(scaleW: number, scaleH: number) {
    const oldBox = this.wrapperBox();

    this.convertedImage.width *= scaleW;
    this.convertedImage.height *= scaleH;

    this.resizableElement.width(this.convertedImage.width);
    this.resizableElement.height(this.convertedImage.height);

    // Keep it centered
    const subElementBox = this.subElementBox();
    this.x = oldBox.cx - (subElementBox.width / 2);
    this.y = oldBox.cy - (subElementBox.height / 2);

    this.setWrapperDimensions();
  }
}
