import { ColorsService } from '../colors/colors.service';
import { Design } from './design';
import { DesignsService } from './designs.service';
import { ImagesService } from '../images/images.service';
import { Observable } from 'rxjs/Observable';
import { ProductsService } from '../products/products.service';
import * as SVG from 'svg.js';

export class DesignTestHelper {
  private static svgRoot = null;

  static defaultDesign(
    designsService: DesignsService,
    colorsService: ColorsService,
    productsService: ProductsService,
    imagesService: ImagesService,
  ): Observable<Design> {
    return Observable.create((observer) => {
      if (this.svgRoot) {
        this.svgRoot.clear();
      }

      this.svgRoot = SVG('canvas')
        .size('100%', '100%')
        .viewbox(0, 0, 600, 800)
      ;

      const design = new Design(this.svgRoot, designsService, colorsService, productsService, imagesService);
      design.productId = productsService.defaultProductId;
      productsService.getProduct(design.productId).subscribe((p) => {
        designsService.updateDesignProduct(design, p).subscribe((d) => {
          observer.next(d);
          observer.complete();
        });
      });
    });
  }

  static expectSelectBoxToTightlyBoundWrapperBox(element, wrapperBox) {
    element.select();
    const selectBox = this.svgRoot.select('.svg_select_boundingRect').get(0).rbox(element.area.svgElement);

    expect(selectBox.width).toBeCloseTo(wrapperBox.width, 0);
    expect(selectBox.height).toBeCloseTo(wrapperBox.height, 0);
    expect(selectBox.x).toBeCloseTo(wrapperBox.x, 0);
    expect(selectBox.y).toBeCloseTo(wrapperBox.y, 0);
  }
}
