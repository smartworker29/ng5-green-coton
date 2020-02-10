import { DropShadow } from '../effects/drop-shadow';
import { Observable } from 'rxjs/Observable';
import { TextElement } from '../text-element';
import * as SVG from 'svg.js';
import { environment } from 'environments/environment';

export class TextCanvas {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  element: TextElement;
  highResScale: number;

  constructor(element: TextElement, highResScale: number) {
    this.element = element;
    this.highResScale = highResScale;
  }

  isIE() {
    var ua = navigator.userAgent;
    /* MSIE used to detect old browsers and Trident used to newer ones*/
    var is_ie = ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;

    return is_ie;
  }

  draw(): Observable<TextCanvas> {
    // temporarily show paths and hide image
    this.element.textPathsContainer.show();
    this.element.imageElement.hide();

    // get the size of the text without effects
    const bbox = this.element.textPathsContainer.bbox();

    const effectMargin = { top: 0, right: 0, bottom: 0, left: 0 };

    this.element.enabledEffects().forEach((effect) => {
      const effectBox = effect.boundingBox();
      if (effectBox) {
        effectMargin['top']   = Math.max(effectMargin['top'], effectBox.top);
        effectMargin['right'] = Math.max(effectMargin['right'], effectBox.right);
        effectMargin['bottom'] = Math.max(effectMargin['bottom'], effectBox.bottom);
        effectMargin['left'] = Math.max(effectMargin['left'], effectBox.left);
      }
    });

    bbox.x -= effectMargin['left'];
    bbox.y -= effectMargin['top'];
    bbox.width = bbox.w += effectMargin['left'] + effectMargin['right'];
    bbox.height = bbox.h += effectMargin['top'] + effectMargin['bottom'];

    this.canvas = document.createElement('canvas') as HTMLCanvasElement;
    this.canvas.width = Math.ceil(bbox.width * this.element.widthScale * this.highResScale);
    this.canvas.height = Math.ceil(bbox.height * this.element.heightScale * this.highResScale);
    this.canvas.classList.add('textCanvas');

    this.context = this.canvas.getContext('2d');
    this.context.strokeStyle = '#' + this.element.fill.rgb;

    const textPathsContainerClone = this.element.textPathsContainer.node.cloneNode(true) as SVGElement;

    // We build a separate svg element we can use to hold the textPath of text so we can load it as an image
    const svgDoc = this.element.area.design.svgRoot.node.cloneNode() as SVGElement;
    svgDoc.setAttribute('id', 'textCanvas');
    svgDoc.setAttribute('width', this.canvas.width.toString());
    svgDoc.setAttribute('height', this.canvas.height.toString());
    svgDoc.setAttribute('preserveAspectRatio', 'none');
    svgDoc.appendChild(textPathsContainerClone);
    svgDoc.setAttribute('viewBox', bbox.x + ' ' + bbox.y + ' ' + bbox.w + ' ' + bbox.h);

    this.element.textPathsContainer.hide();
    this.element.imageElement.show();

    const self = this;
    Object.defineProperty(SVGElement.prototype, 'outerHTML', {
      get: function () {
          var $node, $temp;
          $temp = document.createElement('div');
          $node = this.cloneNode(true);
          $temp.appendChild($node);
          return $temp.innerHTML;
      },
      enumerable: false,
      configurable: true
    });
    if (this.isIE()) {
      return Observable.create((observer) => {
        let html = '<svg ';
        for (let i = 0; i < svgDoc.attributes.length; i++) {
          // if(svgDoc.attributes[i].name != 'xmlns')
            html += `${svgDoc.attributes[i].name}="${svgDoc.attributes[i].value}" `;
        }
        html += `>${textPathsContainerClone.outerHTML}</svg>`
        // html = html.replace ('xmlns="http://www.w3.org/2000/svg" ', ' ') ;
        // html = html.replace ('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ') ;
        const formData = new FormData();


        html = '<?xml version="1.0" encoding="UTF-8" ?>' + html;
        formData.append('data', 'data:image/svg+xml;base64,' + btoa(html));
        const req = new XMLHttpRequest();
        req.open('POST', environment.apiBaseUrl + '/api/v1/svg');
        req.onload = function(e) {
          const svgImg = new Image();
          svgImg.src = req.responseText;
          svgImg.onload = function() {
            self.context.drawImage(svgImg, 0, 0);
            observer.next(self);
            observer.complete();
          };
          svgImg.onerror = function(err) {
            console.error('error loading svgImg: %o', err);
            observer.error(new Error('error loading svgImg: ' + err));
          };
        };
        req.send(formData);
      });
    }

    return Observable.create((observer) => {
      const svgImg = new Image();
      svgImg.onload = function() {
        self.context.drawImage(svgImg, 0, 0);
        observer.next(self);
        observer.complete();
      };
      svgImg.onerror = function(err) {
        console.error('error loading svgImg: %o', err);
        observer.error(new Error('error loading svgImg: ' + err));
      };
      svgImg.src = 'data:image/svg+xml;base64,' + btoa(svgDoc.outerHTML);
    });
  }

  rotate(): HTMLCanvasElement {
    // figure out width/height we need to contain rotated canvas
    const radians = this.element.rotationDegrees * Math.PI / 180;

    const width = this.canvas.height * Math.abs(Math.sin(radians)) + this.canvas.width * Math.abs(Math.cos(radians));
    const height = this.canvas.height * Math.abs(Math.cos(radians)) + this.canvas.width * Math.abs(Math.sin(radians));

    const rotateCanvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
    rotateCanvas.width = width;
    rotateCanvas.height = height;
    rotateCanvas.classList.add('rotate-canvas');

    const rotateCtx = rotateCanvas.getContext('2d');
    rotateCtx.translate(width / 2, height / 2);
    rotateCtx.rotate(radians);
    rotateCtx.drawImage(this.canvas, -this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);

    this.canvas = rotateCanvas;
    this.context = this.canvas.getContext('2d');
    return rotateCanvas;
  }

  crop(): HTMLCanvasElement {
    if (this.canvas.width === 0) {
      return this.canvas;
    }

    // get the tight bounding box of the shaped text on the canvas
    const bbox = this.canvasTextBoundingBox(this.context, 0, 0, this.canvas.width, this.canvas.height);

    const cropCanvasWidth = bbox.width;
    const cropCanvasHeight = bbox.height;

    const cropCanvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
    cropCanvas.width = cropCanvasWidth;
    cropCanvas.height = cropCanvasHeight;
    cropCanvas.classList.add('crop-canvas');

    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(this.canvas, bbox.minX, bbox.minY, bbox.width, bbox.height, 0, 0, cropCanvas.width, cropCanvas.height);

    this.canvas = cropCanvas;
    this.context = this.canvas.getContext('2d');
    return cropCanvas;
  }

  // this method attempts to determine the tight bounding box of the content inside the canvas
  protected canvasTextBoundingBox(ctx: CanvasRenderingContext2D, left = 0, top = 0, width = 0, height = 0): any {
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
}
