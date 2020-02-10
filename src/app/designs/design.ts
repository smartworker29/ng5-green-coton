import { Area } from './area';
import { ColorsService } from '../colors/colors.service';
import { Color } from '../products/color';
import { DesignsService } from './designs.service';
import { DesignsEvent } from './designs-event';
import { Element } from '../element';
import { environment } from '../../environments/environment';
import { Font } from '../ui/font.interfaces';
import { ImagesService } from '../images/images.service';
import { ProductsService } from '../products/products.service';
import { NameAndNumber } from '../elements/names-and-numbers/name-and-number';
import { Observable } from 'rxjs/Observable';
import { Product } from '../products/product';
import { Side } from './side';
import { Size } from './size';
import 'rxjs/add/observable/zip';
const dateFormat = require('dateformat');
const uuidV1 = require('uuid/v1');
import * as JSZip from 'jszip';
import * as _ from 'lodash';
import * as SVG from 'svg.js';

const THUMB_W = 90;
const THUMB_H = 120;
const PROOF_W = 1000;
const PROOF_H = 710;

export class Design {
  public id: string;
  public name: string;
  public svg: string;
  public type = 1; // NOTE: hardcoded to 1 for print... may need to be dynamic in the future
  public product: Product;
  public productColor: Color;
  public sides: Side[] = [];
  public sizes: Size[] = [];
  public namesAndNumbers: NameAndNumber[] = [];
  public currentArea: Area;
  public currentSide: Side;
  public productId: string;
  public editing = false;
  public thumbnailData: string;
  public proofData: string;
  public specialInstructions: string;
  public createdAt: string; // This should be an ISO formatted string in UTC
  public updatedAt: string; // This should be an ISO formatted string in UTC
  public hasUnsavedChanges = false;
  public compatible = true;
  public previewImageUrl: string;

  static newFromJson(
    json: object,
    fullLoad: boolean,
    svgRoot: SVG.Doc,
    designsService: DesignsService,
    colorsService: ColorsService,
    productsService: ProductsService,
    imagesService: ImagesService,
  ): Design {
    const design = new Design(svgRoot, designsService, colorsService, productsService, imagesService);
    design.fromJson(json, fullLoad);
    if (!design.name) {
      design.name = 'Untitled Design';
    }
    design.init();
    return design;
  }

  constructor(
    public svgRoot: SVG.Doc,
    public designsService: DesignsService,
    public colorsService: ColorsService,
    public productsService: ProductsService,
    public imagesService: ImagesService,
  ) {
    this.id = uuidV1();
    this.name = 'Design created ' + dateFormat(new Date());
    this.createdAt = new Date().toISOString();
    this.init();
  }

  private init(): void {
    this.currentSide = this.activeSides[0];
    if (this.currentSide) {
      this.currentArea = this.currentSide.activeAreas[0];
    }
  }

  isIE() {
    var ua = navigator.userAgent;
    /* MSIE used to detect old browsers and Trident used to newer ones*/
    var is_ie = ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;

    return is_ie;
  }

  get elements(): Element[] {
    const elements: Element[] = [];

    for (let i = 0; i < this.sides.length; i++) {
      const side = this.sides[i];
      for (let j = 0; j < side.areas.length; j++) {
        const area = side.areas[j];
        for (let k = 0; k < area.elements.length; k++) {
          elements.push(area.elements[k]);
        }
      }
    }
    return elements;
  }

  get fonts(): Font[] {
    const fonts = [];

    this.elements.forEach((element) => {
      element.fonts().forEach((font) => {
        fonts.push(font);
      });
    });
    return _.uniqBy(fonts, 'family');
  }

  get selectedSizes(): Size[] {
    return this.sizes.filter((s) => s.quantity > 0);
  }

  get thumbnail(): Observable<string> {
    const design = this;
    return Observable.create(async (observer) => {
      const svgImg = new Image();
      const svgImgSrc = 'data:image/svg+xml;base64,' + btoa(design.svgForThumbnail(design.activeSides[0]));

      svgImg.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = svgImg.width;
        canvas.height = svgImg.height;
        const ctx = canvas.getContext('2d');

        // sometimes safari would say the svgImg was loaded, but image elements within it wouldn't be loaded yet, so trying setTimeout
        setTimeout(function() {
          ctx.drawImage(svgImg, 0, 0);
          const thumbnailSrc: string = canvas.toDataURL('image/png');
          design.thumbnailData = thumbnailSrc;
          observer.next(thumbnailSrc);
          observer.complete();
        }, 100);
      };
      svgImg.onerror = function(err) {
        console.error('error loading svgImg: %o', err);
        observer.error(new Error('error loading svgImg'));
      };
      if(!this.isIE())
          svgImg.src = svgImgSrc;
      else
        await this.request(svgImgSrc)
        .then((res: string) => {
          /// ... and then load it to trigger the writing to canvas
          svgImg.src = res;
        });
    });
  }

  request(svgImgSrc: string) {
    return new Promise(function(resolve, reject) {
      var formData = new FormData();
      formData.append("data", svgImgSrc);
      var req = new XMLHttpRequest();
      req.open("POST", "https://www.bluecotton.com/api/v1/svg");
      req.onload = function(e) {
        resolve(req.responseText)
      };
      req.send(formData);
    })
  }

  get proof(): Observable<string> {
    const design = this;
    return Observable.create(async (observer) => {

      // set up the canvas which will have an image for each side
      const canvas = document.createElement('canvas');
      canvas.width = PROOF_W;
      canvas.height = PROOF_H;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'gray';
      ctx.fillRect(canvas.width / 2 - 3, 0, 5, canvas.height);

      const imagesToLoad = [];
      for(const side of design.activeSides) {
      // design.activeSides.forEach((side, index) => {
        // for each side, we get that side's svg as an image...
        if (side.isSleeve() && !side.elements.length) {
          // return;
          continue;
        }

        let destBox = { x: 0, y: 0, w: 0, h: 0 };
        let outlineBox = false;
        switch (side.name) {
          case 'Front':
            // Place on left-half of proof
            destBox = { x: 0, y: 0, w: PROOF_W / 2, h: PROOF_H };
            break;
          case 'Back':
            // Place on right-half of proof
            destBox = { x: PROOF_W / 2 + 3, y: 0, w: PROOF_W / 2, h: PROOF_H };
            break;
          case 'Left':
            // Place in small square, top-center of proof
            // NOTE: using PROOF_W for height is not a typo... our sleeves are square
            destBox = { x: (PROOF_W / 2) - (PROOF_W / 10 / 2), y: PROOF_H - PROOF_W / 10 - 15, w: PROOF_W / 10, h: PROOF_W / 10 };
            outlineBox = true;
            break;
          case 'Right':
            // Place in small square, bottom-center of proof
            // NOTE: using PROOF_W for height is not a typo... our sleeves are square
            let offset = 15;
            let unit = 10;
            if(_.find(design.activeSides, (item => item.elements.length && item.name === 'Left'))) {
              offset = 40;
              unit = 5;
            }
            destBox = { x: (PROOF_W / 2) - (PROOF_W / 10 / 2), y: PROOF_H - PROOF_W / unit - offset, w: PROOF_W / 10, h: PROOF_W / 10 };
            outlineBox = true;
            break;
          default:
            break;
        }
        const srcScale = 1.35; // we'll scale up the svg a little so we can 'zoom in' by writing a window of the zoomed svg onto the canvas
        const svgImgSrc: string = 'data:image/svg+xml;base64,'
                                + btoa(design.svgForThumbnail(side, destBox.w * srcScale, destBox.h * srcScale));
        const svgImg = new Image();
        imagesToLoad.push(svgImg);

        svgImg.onload = function() {
          // sometimes safari would say the svgImg was loaded, but image elements within it wouldn't be loaded yet, so trying setTimeout
          setTimeout(function() {
            // Draw a window of the zoomed design onto the right spot on the canvas
            if (side.isSleeve()) {
              ctx.drawImage(svgImg, destBox.x, destBox.y, destBox.w, destBox.h);
            } else {
              ctx.drawImage(svgImg, svgImg.width / 8, svgImg.height / 12, destBox.w, destBox.h, destBox.x, destBox.y, destBox.w - 3, destBox.h);
            }

            if (outlineBox) {
              ctx.strokeStyle = 'gray';
              ctx.lineWidth = 10;
              ctx.strokeRect(destBox.x, destBox.y, destBox.w, destBox.h);
              ctx.strokeRect(destBox.x, destBox.y + destBox.h + 5, destBox.w, 10);
              ctx.fillStyle = 'white';
              ctx.font='15px Calibri';
              ctx.textAlign='center';
              ctx.fillText(`${side.name} Sleeve`, destBox.x + destBox.w / 2, destBox.y+destBox.h+10)
            }
            imagesToLoad.pop();
          }, 100);
        };
        svgImg.onerror = function(err) {
          console.error('error loading svgImg: %o', err);
          observer.error(new Error('error loading svgImg'));
        };

        if(!this.isIE())
          svgImg.src = svgImgSrc;
        else
          await this.request(svgImgSrc)
          .then((res: string) => {
            /// ... and then load it to trigger the writing to canvas
            svgImg.src = res;
          });
      };

      // Now, we'll wait for each side of the design to be written to the canvas
      const waitForImages = setInterval(function() {
        if (!imagesToLoad.length) {
          // add the watermark
          const watermarkImg = new Image();
          watermarkImg.onload = function() {
            ctx.drawImage(watermarkImg, PROOF_W - 80 - watermarkImg.width, PROOF_H - 10 - watermarkImg.height, watermarkImg.width, watermarkImg.height);
            // and then we'll get the DataURI of the resulting proof image, and return it to whoever was waiting
            const proofSrc: string = canvas.toDataURL('image/png');
            design.proofData = proofSrc;
            observer.next(proofSrc);
            observer.complete();
          };
          watermarkImg.src = environment.assetUrl + 'assets/proof-watermark.png';
          watermarkImg.setAttribute('crossOrigin', 'anonymous');

          // and stop this silly loop
          clearInterval(waitForImages);
        }
      }, 100);

    });
  }

  // return zip file with export assets
  get export(): Observable<JSZip> {
    return Observable.create((observer) => {
      const exportZip = new JSZip();
      const sideExports: Observable<{side: Side, export: ArrayBuffer}>[] = [];
      this.sides.forEach((side) => { sideExports.push(side.export()); });
      const design = this;
      Observable.zip(...sideExports).subscribe((sides) => {
        // NOTE: this runs only when each side finishes exporting
        sides.forEach((side) => {
          if (side) {
            exportZip.file(design.id + '-' + side['side'].name + '.png', side['export']);
          }
        });
        observer.next(exportZip);
        observer.complete();
      });
    });
  }

  changeProduct(product: Product): Observable<Design> {
    return Observable.create((observer) => {
      this.product = product;
      this.productId = product.id;

      this.sizes = product.availableSizes().map((s) => new Size(s, this.quantityForSize(s)));

      if (!this.productColor || !_.find(product.availableColors(), (c => c.id === this.productColor.id))) {
        this.productColor = product.color;
      }
      this.addDesignSidesAndAreas(product);
      this.writeToSvg().subscribe((design) => {
        observer.next(design);
        observer.complete();
      });
    });
  }

  quantityForSize(size: string) {
    let quantity = 0;
    this.sizes.forEach((s) => {
      if (s.size === size) {
        quantity = s.quantity;
      }
    });
    return quantity;
  }

  updateSizes(sizes: Size[]) {
    this.sizes = sizes;
    this.sides.forEach((side) => {
      if (side.isSleeve()) {
        side.active = this.totalQuantity >= 6;
      }
    });

    if (!this.currentSide.active) {
      // if we just deactivated the current side, show the first side
      this.showSide(this.activeSides[0]);
    } else {
      // we may have just activated more sides, which would cause them all to be shown
      // so re-show the currentSide to hide the others
      this.showSide(this.currentSide);
    }
  }

  updateNamesAndNumbers(namesAndNumbers: NameAndNumber[]): Design {
    this.namesAndNumbers = namesAndNumbers;
    return this;
  }

  changeProductColor(color: Color): Observable<Design> {
    return Observable.create((observer) => {
      this.productColor = color;

      const sides: Observable<void>[] = [];
      this.sides.forEach((side) => { sides.push(side.addImage()); });
      this.sides.forEach(s => s.addImage());

      // Remove quantities for sizes that are no longer valid
      // TODO: Let the user know it was removed?
      this.sizes.forEach((size) => {
        if (!_.includes(this.productColor.sizes, size.size)) {
          size.quantity = 0;
        }
      });

      Observable.zip(...sides).subscribe((sideImages) => {
        // NOTE: this runs when all sides are done updating their images
        observer.next(this);
        observer.complete();
      });
    });
  }

  public showSide(side: Side) {
    this.sides.forEach((s) => s.hide());
    side.show();
    this.currentSide = side;
    if (this.currentSide.areas.length > 0) {
      this.currentArea = this.currentSide.areas[0];
    }
  }

  get activeSides(): Side[] {
    return this.sides.filter((s) => s.active);
  }

  get hasSleeves(): boolean {
    return !!this.sides.find(s => s.isSleeve());
  }

  get totalQuantity(): number { return this.sizes.reduce((a, b) => { return a + b.quantity; }, 0); }
  get colorCount(): number { return this.sides.reduce((a, b) => { return a + b.colorCount; }, 0); }

  // This must be run when the product is changing for the current design or when a design is being created
  private addDesignSidesAndAreas(p: Product) {
    if (!p) {
      return;
    }

    // create sides, areas, and product images
    const design = this;
    for (const s of p.sides) {
      let side = this.sides.find((x) => x.name === s.name);
      if (side) {
        side.masks = s.masks;
        side.pixelsPerInch = s.pixelsPerInch;
        side.imageUrl = s.imageUrl;
      } else {
        side = new Side(design, s.name, s.imageUrl);
        side.masks = s.masks;
        side.pixelsPerInch = s.pixelsPerInch;
        design.sides.push(side);
      }

      if (s.areas.length) {
        s.areas.forEach((a, index) => {
          let area = side.areas.find((x, i) => x.name === side.name + (index + 1));
          if (!area) {
            area = new Area(design, side, index, a.coords(), design.imagesService);
            area.updateDimensions(a);
            side.areas.push(area);
          } else {
            area.updateDimensions(a);
          }
        });
      } else {
        let area = side.areas.find((x, i) => x.name === side.name + 1);
        if (!area) {
          const sleeveWidth = 3.25 * s.pixelsPerInch;
          const sleeveHeight = 3.25 * s.pixelsPerInch;
          const a = { x: 0, y: 0, w: sleeveWidth, h: sleeveHeight};
          area = new Area(design, side, 0, a, design.imagesService);
          area.updateDimensions(a);
          side.areas.push(area);
        }
      }
    }

    this.sides.forEach((s) => {
      // inactivate any sides in this design but not in the product
      s.active = !!p.sides.find((side) => side.name === s.name);
    });

    // inactivate sleeves if quantity requirement not met
    this.activeSides.forEach(s => {
      if (s.isSleeve() && this.totalQuantity < 6) {
        s.active = false;
      }
    });

    if (this.activeSides.length > 0) {
      this.currentSide = this.activeSides[0];
    }

    if (this.currentSide) {
      this.currentArea = this.currentSide.areas[0];
    }
  }

  writeToSvg(): Observable<Design> {
    return Observable.create((observer) => {
      const sides: Observable<Side>[] = [];
      this.sides.forEach((side) => { sides.push(side.writeToSvg()); });
      Observable.zip(...sides).subscribe((sideWrites) => {
        // NOTE: this code runs when all sides done writing
        observer.next(this);
        observer.complete();
      });
    });
  }

  toJson(): object {
    return {
      design: {
        id: this.id,
        name: this.name,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        specialInstructions: this.specialInstructions,
        type: this.type,
        productColor: this.productColor,
        productId: this.product.id,
        sides: this.sides.map((s) => s.toJson()),
        sizes: this.sizes.map((s) => s.toJson()),
        namesAndNumbers: this.namesAndNumbers.map((n) => n.toJson()),
        thumbnail: this.thumbnailData,
        proof: this.proofData,
      }
    };
  }

  fromJson(json: object, fullLoad: boolean): void {
    this.id = json['id'];
    this.name = json['name'];
    this.type = json['type'];
    this.compatible = json['version'] === '2';
    this.previewImageUrl = json['preview'];
    this.createdAt = json['createdAt'];

    if (fullLoad) {
      this.createdAt = json['createdAt'];
      this.updatedAt = json['updatedAt'];
      this.specialInstructions = json['specialInstructions'];
      this.productColor = Color.newFromJson(json['productColor']);
      this.productId = json['productId'];
      this.sides = json['sides'].map((s) => Side.newFromJson(s, this));
      this.sizes = json['sizes'].map((s) => Size.newFromJson(s));
      this.namesAndNumbers = json['namesAndNumbers'].map((s) => NameAndNumber.newFromJson(s));
    }
  }

  private svgForThumbnail(side: Side, width = THUMB_W, height = THUMB_H): string {
    const selected = this.svgRoot.select('.selected');
    selected.each(function() { this.selectify(false) });

    const origCurrentSide = this.currentSide;
    if (side !== origCurrentSide) {
      this.showSide(side);
    }

    // Firefox needs a pixel-based width/height on the root svg
    // so we'll save these attributes of the svg so we can restore them in a minute
    const origWidth = this.svgRoot.width();
    const origHeight = this.svgRoot.height();
    const origTransform = this.svgRoot.attr('transform');
    const origViewBox = this.svgRoot.viewbox();

    this.svgRoot
      .width(width)
      .height(height)
      .attr('transform', null)
      .viewbox({ x: 0, y: 0, width: origViewBox.width, height: origViewBox.height}) // reset the zoom level
    ;

    let svg = this.svgRoot.svg();
    if (side.isSleeve()) {
      // NOTE: assumes there's exactly one area per sleeve
      const area = side.activeAreas[0];
      this.svgRoot.width(area.svgElement.width());
      this.svgRoot.height(area.svgElement.height());
      this.svgRoot.viewbox(area.svgElement.x(), area.svgElement.y(), area.svgElement.width(), area.svgElement.height());
      svg = this.svgRoot.svg();
    }

    // now perform some cleanup of the svg
    // safari apparently changes href attributes on image tags to ns1:href
    svg = svg.replace(/ns\d\d*:href/gi, 'xlink:href');

    // restore original width/height
    this.svgRoot
      .width(origWidth)
      .height(origHeight)
      .viewbox(origViewBox)
      .attr('transform', origTransform)
      ;

    if (side !== origCurrentSide) {
      this.showSide(origCurrentSide);
    }

    selected.each(function() { this.selectify(true) });
    return svg;
  }

  broadcastEvent(designsEvent: DesignsEvent) {
    this.designsService.broadcastEvent(designsEvent);
  }

  unselectAllElements() {
    this.designsService.unselectAllElements();
  }

  removeElement(area: Area, element: Element) {
    this.designsService.removeElement(area, element);
  }

  updateElement(area: Area, element: Element, likelyToAffectPricing = true) {
    this.designsService.updateElement(area, element, likelyToAffectPricing);
  }

  public legacyLoadUrl() {
    return 'https://retired.bluecotton.com/saved_design_open.cgi?target=' + this.id + '&preview=1&edit_link=1';
  }

  public hasServerSave(): boolean {
    if (this.id.match(/[a-z]/i)) {
      return false;
    } else {
      return true;
    }
  }

  public resetId() {
    this.id = uuidV1();
  }
}
