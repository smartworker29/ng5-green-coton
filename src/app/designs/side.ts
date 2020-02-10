import { Area } from './area';
import { Color as ProductColor } from '../products/color';
import { Color } from '../colors/color';
import { Design } from './design';
import { Element } from '../element';
import { Mask } from '../products/mask';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/forkJoin';
import * as SVG from 'svg.js';
import * as request from 'request';
import * as _ from 'lodash';
require('../../../node_modules/svg.filter.js/dist/svg.filter.js');

export class Side {
  public  name: string;
  public  areas: Area[] = [];
  public active = true;
  private design: Design;
  public imageUrl: string;
  public pixelsPerInch: number;
  public svgElement: SVG.Nested;
  public masks: Mask[] = [];
  public distressed = false;
  private productImageElement: any;
  private sideLabel: any;
  private sideNotes: any;

  static newFromJson(json: object, design: Design): Side {
    const side = new Side(design, null, null);
    side.fromJson(json);
    return side;
  }

  constructor(design: Design, name: string, imageUrl: string) {
    this.design = design;
    this.name = name;
    this.imageUrl = imageUrl;

    if (this.isSleeve() && this.design.totalQuantity < 6) {
      this.active = false;
    }
  }

  get id(): string {
    return 'design-side-' + this.name;
  }

  get imageId(): string {
    return 'design-side-image-' + this.name;
  }

  get colorCount(): number {
    return this.elements.reduce((a, b) => {
      return a + b.toLayer().colors.length;
    }, 0);
  }

  get colors(): Color[] {
    const colors = [];
    this.elements.forEach((e) => {
      e.toLayer().colors.forEach((color) => {
        colors.push(color);
      });
    });
    return _.uniqBy(colors, 'id');
  }

  get elements(): Element[] {
    const elements: Element[] = [];
    for (let i = 0; i < this.areas.length; i++) {
      const area = this.areas[i];
      for (let j = 0; j < area.elements.length; j++) {
        elements.push(area.elements[j]);
      }
    }
    return elements;
  }


  get activeAreas(): Area[] {
    return this.areas.filter((s) => s.active);
  }

  get scale(): number {
    // Sleeve areas are so small relatively to other print areas, that they're hard to work with unless they're zoomed
    // But we have to be careful, because we need to preserve their actual physical dimensions for proper exporting
    // So we'll use scale to make it bigger in the designer, and then to reduce size in the export
    return this.isSleeve() ? 2 : 1;
  }

  writeToSvg(): Observable<Side> {
    return Observable.create((observer) => {
      if (!this.svgElement) {
        this.svgElement = this.design.svgRoot.nested().attr('id', this.id);
      }

      if (this.isSleeve()) {
        // NOTE: this side needs to be same dimensions as its area, but we don't have area yet...
        // So the area's writeToSvg() method will update this sleeve's .product-image's width/height
        if (!this.productImageElement) {
          this.productImageElement = this.svgElement
              .rect()
              .addClass('product-image')
              .fill(this.design.productColor.swatch())
              .attr({id: this.imageId});
        }

        if (!this.sideLabel) {
          this.sideLabel = this.svgElement.text(this.name + ' Sleeve')
            .attr({
              'font-family': 'Montserrat',
              'font-size': '30px',
            })
            .addClass('side-label')
            .center(this.design.svgRoot.viewbox().width / 2, 25)
            .y(25);
          this.svgElement.before(this.sideLabel);
        }

        if (!this.sideNotes) {
          this.sideNotes = this.svgElement.nested()
                          .text('NOTE: sleeve prints are 3.25" by 3.25" and may use no more than 2 colors.')
                          .attr({'font-size': '16px'})
                          .addClass('side-notes')
                          .center(this.design.svgRoot.viewbox().width / 2, this.design.svgRoot.viewbox().height / 2)
          ;
          this.svgElement.after(this.sideNotes);
        }

      } else {
        // Not a sleeve side...
        if (!this.productImageElement) {
          this.productImageElement = this.svgElement.image()
            .attr({id: this.imageId, height: '100%', width: '100%'})
            .back();
        }
      }

      this.areas.forEach((a) => a.writeToSvg());
      this.addImage().subscribe((image) => {
        if (this.active) {
          this.show();
        } else {
          this.hide();
        }

        observer.next();
        observer.complete();
      });
    });
  }


  show(): void {
    this.svgElement.show();
    if (this.productImageElement) {
      this.productImageElement.show();
    }
    if (this.sideLabel) {
      this.sideLabel.show();
    }
    if (this.sideNotes) {
      this.sideNotes.show();
    }
  }

  hide(): void {
    this.svgElement.hide();
    if (this.productImageElement) {
      this.productImageElement.hide();
    }
    if (this.sideLabel) {
      this.sideLabel.hide();
    }
    if (this.sideNotes) {
      this.sideNotes.hide();
    }
  }

  export(): Observable<{side: Side, export: ArrayBuffer}> {
    return Observable.create((observer) => {
      if (!this.elements.length) {
        observer.next(null);
        observer.complete();
      } else {
        const selected = this.design.svgRoot.select('.selected');
        selected.each(function() { this.selectify(false) });

        const side = this;

        // NOTE: here's why we choose these dimensions..
        //   width: 13" @ 300dpi = 3900 pixels, height: 21.66666" @ 300dpi = 6500 pixels
        const pngWidth = this.activeAreas[0].width() / this.pixelsPerInch * 300 / this.scale;
        const pngHeight = this.activeAreas[0].height() / this.pixelsPerInch * 300 / this.scale;

        // Set up a separate SVG Doc for exporting a high-quality image of this side
        const svgDoc = this.design.svgRoot.node.cloneNode() as SVGElement;
        svgDoc.setAttribute('width', pngWidth.toString());
        svgDoc.setAttribute('height', pngHeight.toString());
        svgDoc.appendChild(this.svgElement.toDoc().defs().node.cloneNode(true));

        // NOTE: we want the area on this side to take up the full exported png
        // So we'll adjust the root svg's viewbox to "zoom in" on this area
        const viewBox = [
          this.activeAreas[0].svgElement.x().toString(),
          this.activeAreas[0].svgElement.y().toString(),
          this.activeAreas[0].svgElement.width().toString(),
          this.activeAreas[0].svgElement.height().toString(),
        ];
        svgDoc.setAttribute('viewBox', viewBox.join(' '));

        const sideElement = this.svgElement.node.cloneNode() as SVGElement;
        sideElement.style.display = ''; // mark this side as visible for the export
        svgDoc.appendChild(sideElement);
        svgDoc.removeAttribute('transform');

        // Remove the .product-image element if present
        const productImage = svgDoc.querySelector('.product-image');
        if (productImage) {
          productImage.remove();
        }

        const canvas = document.createElement('canvas') as HTMLCanvasElement;
        canvas.width = parseInt(svgDoc.getAttribute('width'), 10);
        canvas.height = parseInt(svgDoc.getAttribute('height'), 10);
        const ctx = canvas.getContext('2d');

        const elementImageTasks$ = [];

        this.activeAreas.forEach(area => {
          const productRgb = area.design.productColor.toRgb();

          const areaElement = area.svgElement.node.cloneNode() as SVGElement;
          sideElement.appendChild(areaElement);

          const maxImprintAreaElement = area.maxImprintAreaElement.node.cloneNode() as SVGElement;
          areaElement.appendChild(maxImprintAreaElement);

          // sort elements so N&N is always on top
          const sortedElements = area.elements.reverse().sort((a, b) => {
            if (a.className === 'NamesAndNumbersElement') {
              return 1;
            }
            return -1;
          });

          sortedElements.forEach(e => {
            elementImageTasks$.push(Observable.create(elementImageObserver => {
              while (maxImprintAreaElement.firstChild) {
                maxImprintAreaElement.removeChild(maxImprintAreaElement.firstChild);
              }

              const elementNode = e.svgElement.node.cloneNode(true) as SVGElement;
              maxImprintAreaElement.appendChild(elementNode);

              // * snapshot the svgDoc
              const elementSvg = svgDoc.outerHTML.replace(/ns\d\d*:href/gi, 'xlink:href');
              const elementImage = new Image();
              elementImage.onload = function() {
                ctx.drawImage(elementImage, 0, 0);
                if (e.colors().find(c => c.id === 'GARMENT_COLOR')) {
                  const imageData = ctx.getImageData(0, 0, elementImage.width, elementImage.height);
                  const data = imageData.data;
                  for (let i = 0; i < data.length; i += 4) {
                    if (data[i] === productRgb[0] && data[i + 1] === productRgb[1] && data[i + 2] === productRgb[2]) {
                      data[i] = 12;
                      data[i + 1] = 34;
                      data[i + 2] = 56;
                      data[i + 3] = 0.78;
                    }
                  }
                  ctx.putImageData(imageData, 0, 0);
                }
                elementImageObserver.next(e);
                elementImageObserver.complete();
              };
              elementImage.src = 'data:image/svg+xml;base64,' + btoa(elementSvg);
            }));
          });
        });

        Observable.forkJoin(...elementImageTasks$).subscribe(results => {
          // change any 'garment colors' to transparent now that design has been flattened
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] === 12 && data[i + 1] === 34 && data[i + 2] === 56 && data[i + 3] === 0.78) {
              data[i + 3] = 0;
            }
          }
          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob(function(blob) {
            const reader = new FileReader();
            reader.addEventListener('loadend', function() {
              observer.next({side: side, export: reader.result});
              observer.complete();
            });
            reader.readAsArrayBuffer(blob);
          });
        });
      }
    });
  }

  public addImage(): Observable<void> {
    if (this.isSleeve()) {
      return this.addSleeveImage();
    }

    if (!this.imageUrl) {
      return Observable.empty<void>();
    }

    if (!this.design.productColor) {
      return Observable.empty<void>();
    }

    return Observable.create((observer) => {
      this.dataUriForImageUrl(this.imageUrl).subscribe((imageDataUri) => {
        this.removeImage();

        this.productImageElement = this.svgElement.image()
          .attr({id: this.imageId, height: '100%', width: '100%'})
          .back();

        this.productImageElement.loaded((loader) => {
          this.svgElement.before(this.productImageElement);

          const color: ProductColor = this.design.productColor;

          if (color.images.length > 0) {
            this.applyImageBasedFilter().subscribe(() => {
              observer.next();
              observer.complete();
            });

          } else if (color.display.length > 0) {
            return this.applyRgbBasedFilter().subscribe(() => {
              observer.next();
              observer.complete();
            });
          }
        }).load(imageDataUri);
      });
    });
  }

  private addSleeveImage(): Observable<void> {
    return Observable.create((observer) => {
      if (this.design.productColor.display[0].type === 'image') {
        // NOTE: use part of the image from the back of this product to fill the sleeve

        // TODO: Not sure why we need both cases but .back doesn't work when loading a saved design.
        let backUrl: string;

        const avail = this.design.product.availableColors();
        for (let i = 0; i < avail.length; i++) {
          if (avail[i].id === this.design.productColor.id) {
            backUrl = avail[i].images[0].back;
          }
        }

        if (backUrl) {
          this.dataUriForImageUrl(backUrl).subscribe((imageDataUri) => {
            const backImage = new Image();
            backImage.onload = () => {
              const area = this.areas[0];

              const canvas = document.createElement('canvas') as HTMLCanvasElement;
              canvas.width = area.width();
              canvas.height = area.height();
              const ctx = canvas.getContext('2d');

              // draw a portion of the backImage (roughly the center) to the canvas
              ctx.drawImage(backImage, backImage.width / 2 - 80, backImage.height / 2 - 80, 160, 160, 0, 0, area.width(), area.height());

              const pattern = this.design.svgRoot
                .pattern(area.width(), area.height(), (add) => {
                  add.image(canvas.toDataURL()).width(area.width()).height(area.height());
                })
                .attr('patternUnits', 'objectBoundingBox')
                .x(1).y(0).width(1).height(1)
              ;
              this.productImageElement.fill(pattern);

              observer.next();
              observer.complete();
            };
            backImage.src = imageDataUri;
          });
        }
      } else {
        this.productImageElement.fill(this.design.productColor.swatch());
        observer.next();
        observer.complete();
      }
    });
  }

  private removeImage(): void {
    if (this.productImageElement) {
      this.productImageElement.unfilter(true);
      this.productImageElement.remove();
    }
  }

  private dataUriForImageUrl(url: string): Observable<string> {
    return Observable.create((observer) => {
      const headers = { 'Cache-Control': 'no-cache'};
      request({uri: url, headers: headers, encoding: null}, function(err, res, data) {
        if (err) {
          console.error(err);
          observer.error(err);
        } else {
          data = 'data:' + res.headers['content-type'] + ';base64,' + data.toString('base64');
          observer.next(data);
        }
        observer.complete();
      });
    });
  }

  private applyImageBasedFilter(): Observable<void> {
    const color: ProductColor = this.design.productColor;
    const maskFilter = this.productImageElement.filter();
    const sideURL = this.sideImageUrl(color);

    if (!sideURL) {
      return Observable.empty<void>();
    }

    return Observable.create((observer) => {
      this.dataUriForImageUrl(sideURL).subscribe((maskImageDataUri) => {
        const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
        const maskImage = <HTMLImageElement> document.createElement('img');
        const self = this;
        maskImage.onload = function() {
          self.show(); // needs to be visible to get width/height
          canvas.width = maskImage.width;
          canvas.height = maskImage.height;
          if (self.design.currentSide !== self) {
            self.hide();
          }
          const context = canvas.getContext('2d');
          context.drawImage(maskImage, 0, 0);

          const coloredImage = maskFilter.image(canvas.toDataURL()).attr('in', '');
          coloredImage.x(self.productImageElement.x());
          coloredImage.y(self.productImageElement.y());
          coloredImage.width('100%');
          coloredImage.height('100%');

          observer.next();
          observer.complete();
        };
        maskImage.src = maskImageDataUri;
      });
    });
  }

  private applyRgbBasedFilter(): Observable<void> {
    return Observable.create((observer) => {
      const color: ProductColor = this.design.productColor;
      const maskFilter = this.productImageElement.filter();

      let lastBlendResult;
      let maskLimit = 0;

      // Garments can have an unequal number of masks on each side.
      this.masks.forEach((mask, i) => {
        if (mask.imageUrl) {
          maskLimit++;
        }
      });

      this.masks.forEach((mask, i) => {
        if (mask.imageUrl) {
          // Get mask image, and position it exactly in the same place as the original image
          this.dataUriForImageUrl(mask.imageUrl).subscribe((maskImageDataUri) => {
            // create canvas to hold maskImage data so we can change its color
            const maskImage = <HTMLImageElement> document.createElement('img');
            const self = this;
            maskImage.onload = function() {
              const maskImageCanvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
              self.show(); // needs to be visible to get width/height
              maskImageCanvas.width = maskImage.width;
              maskImageCanvas.height = maskImage.height;
              if (self.design.currentSide !== self) {
                self.hide();
              }
              const maskImageCanvasContext = maskImageCanvas.getContext('2d');
              maskImageCanvasContext.drawImage(maskImage, 0, 0);

              // copy the maskImage's red channel to its alpha channel
              const maskImageData: ImageData = maskImageCanvasContext.getImageData(0, 0, maskImage.width, maskImage.height);
              const px = maskImageData.data;
              for (let pixel = 0; pixel < px.length; pixel += 4) {
                px[pixel + 3] = px[pixel];
              }
              maskImageCanvasContext.putImageData(maskImageData, 0, 0);

              // create a canvas to hold the final result
              const resultCanvas = <HTMLCanvasElement> document.createElement('canvas');
              resultCanvas.width = maskImage.width;
              resultCanvas.height = maskImage.height;
              const resultContext = resultCanvas.getContext('2d');

              // draw the mask on the canvas
              resultContext.globalCompositeOperation = 'copy';
              resultContext.drawImage(maskImageCanvas, 0, 0);

              // now draw the colored mask on the canvas
              resultContext.globalCompositeOperation = 'source-out';
              const maskRGB = color.maskRGBs[i] ? color.maskRGBs[i].rgb : color.swatch(i);
              resultContext.fillStyle = '#' + maskRGB;
              resultContext.fillRect(0, 0, maskImage.width, maskImage.height);

              // now, we create an feImage with the colored mask data
              const coloredImage = maskFilter.image(resultCanvas.toDataURL()).attr('in', '');
              coloredImage.x(self.productImageElement.x());
              coloredImage.y(self.productImageElement.y());
              coloredImage.width('100%');
              coloredImage.height('100%');

              // filter the mask images together through a normal blend
              if (i > 0) {
                const thisBlend = maskFilter.blend(coloredImage.node.result.baseVal, lastBlendResult, 'normal');
                lastBlendResult = thisBlend.node.result.baseVal;
              } else {
                lastBlendResult = coloredImage.node.result.baseVal;
              }
              // if all mask images have been combined, blend with the sourceGraphic with multiply mode
              //    to preserve texture
              if (i === maskLimit - 1) {
                maskFilter.blend()
                    .attr('in', 'SourceGraphic')
                    .attr('in2', lastBlendResult)
                    .attr('mode', 'multiply')
                    ;
              }

            };
            maskImage.src = maskImageDataUri;

          }); // End image filter
        }
      });
      observer.next();
      observer.complete();
    });
  }

  private sideImageUrl(color: ProductColor) {
    switch (this.name.toString()) {
      case 'Front': {
        return color.images[0].front;
      }
      case 'Back': {
        return color.images[0].back;
      }
      default: {
        return color.images[0].front;
      }
    }
  }

  toJson(): object {
    return {
      name: this.name,
      imageUrl: this.imageUrl,
      masks: this.masks.map((m) => m.toJson()),
      areas: this.areas.map((a) => a.toJson()),
      colors: this.colors,
      distressed: this.distressed,
    };
  }

  fromJson(json: object): void {
    this.name = json['name'];
    this.imageUrl = json['imageUrl'];
    this.pixelsPerInch = json['pixelsPerInch'];
    this.masks = json['masks'].map((m) => Mask.newFromJson(m));
    this.areas = json['areas'].map((a) => Area.newFromJson(a, this.design, this, this.design.imagesService));
    this.distressed = json['distressed'];
  }

  isSleeve(): boolean {
    if (this.name === 'Left' || this.name === 'Right') {
      return true;
    }
    return false;
  }
}
