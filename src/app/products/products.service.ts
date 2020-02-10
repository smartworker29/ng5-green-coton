import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/mergeMap';

import { Category } from './category';
import { Color, MaskRGB } from './color';
import { Mask } from './mask';
import { Product } from './product';
import { Side } from './side';
import { Area } from './area';
import { Variant } from './variant';

@Injectable()
export class ProductsService {

  defaultProductId = '708';
  private productUrl = environment.apiBaseUrl + '/api/v1/garment/';
  private productsUrl = environment.apiBaseUrl + '/api/v1/garments/category/';
  private categoriesUrl = environment.apiBaseUrl + '/api/v1/garments/categories';
  public limit = 15;
  constructor (private http: Http) {}

  getProduct(id: string): Observable<Product> {
    return this.http.get(this.productUrl + id)
                    .map(res => this.extractProductData(res.json()))
                    .catch(this.handleError);
  }

  getProducts(selectedCategory?: Category): Observable<Product[]> {
    let url = this.productsUrl;
    if (selectedCategory) {
      url += selectedCategory.id;
    }

    return this.http.get(url)
                    .map(res => this.extractProductsData(res))
                    .map(products => products.sort(this.sortBySort))
                    .catch(this.handleError);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get(this.categoriesUrl)
                    .map(res => this.extractCategoryData(res))
                    .map(categories => categories.sort(this.sortBySort))
                    .catch(this.handleError);
  }

  search(term: string, page = 1): Observable<Product[]> {
    const url = this.productsUrl + 'search?q=' + term
                                 + '&limit=' + this.limit
                                 + '&page=' + page;
    return this.http.get(url)
                    .map(res => this.extractProductsData(res))
                    .map(cliparts => cliparts.sort(this.sortBySort))
                    .catch(this.handleError);
  }

  protected extractProductData(data: any): Product {
    if (data) {
      return this.buildProductFromJson(data);
    }
    return null;
  }

  private extractProductsData(res: Response): Product[] {
    const body = res.json();
    if (body) {
      const self = this;
      return body.map(function(p) {
        if (p) {
          return self.buildProductFromJson(p);
        }
      }).filter(function(p) { return p !== undefined; });
    } else {
      return [];
    }
  }

  private buildProductFromJson(p: any): Product {
    const product = new Product();
    product.id = p.id;
    product.name = p.name;
    product.imageUrl = p.imageUrl;
    product.isPromo = p.is_promo;
    product.sort = p.sort;
    product.minimum = p.minimum;
    if (p.sides) {
      for (const s of p.sides) {
        const side = new Side();
        side.name = s.name;
        side.imageUrl = s.imageUrl;
        side.pixelsPerInch = s.pixelsPerInch;
        s.masks.forEach((m, i) => {
          const mask = new Mask();
          mask.index = m.index;
          mask.previewImageUrl = m.previewImageUrl;
          mask.imageUrl = m.imageUrl;
          side.masks.push(mask);
        });
        if (s.areas) {
          s.areas.forEach((a, i) => {
            side.areas.push(new Area(a));
          });
        }
        product.sides.push(side);
      }
    }
    if (p.colors) {
      for (const c of p.colors) {
        const color = new Color();
        color.sort = c.sort;
        color.name = c.name;
        color.id = c.id;
        color.sizes = c.sizes.map((col) => { return col.size; });

        for (const d of c.display) {
          const prefix = Object.keys(d)[0].toString() === 'hex' ? '#' : '';
          color.display.push({type: Object.keys(d)[0], value: prefix + d[Object.keys(d)[0]]});
        }
        for (const i of c.color_images) {
          if (i[Object.keys(i)[0]] ||
             i[Object.keys(i)[1]] ||
             i[Object.keys(i)[2]] ||
             i[Object.keys(i)[3]]) {
            color.images.push({
              'left': i[Object.keys(i)[0]],
              'right': i[Object.keys(i)[1]],
              'front': i[Object.keys(i)[2]],
              'back': i[Object.keys(i)[3]]
            });
          }
        }

        color.maskRGBs = c.maskRGBs.map((m) => { return { index: m.index, rgb: m.hexValue } as MaskRGB; });

        for (const s of c.sizes) {
          const v = new Variant();
          v.color = color;
          v.size = s.size;
          product.variants.push(v);
        }
      }
    }
    return product;
  }

  private extractCategoryData(res: Response): Category[] {
    const body = res.json();
    if (body) {
      const self = this;
      return body.map(function(c) {
        if (c) {
          return self.buildCategoryFromJson(c);
        }
      }).filter(function(c) { return c !== undefined; });
    }
    return [];
  }

  private buildCategoryFromJson(c: any): Category {
    const category = new Category();
    category.id = c.id;
    category.name = c.name;
    category.sort = c.sort;
    category.imageUrl = c.imageUrl;
    category.parentId = c.parentId;
    return category;
  }

  // TODO: DRY this method as it's duplicated between services
  private sortBySort(a: Product|Category, b: Product|Category): number {
    if (a.sort < b.sort ) {
      return -1;
    }
    if (a.sort > b.sort ) {
      return 1;
    }
    return 0;
  }

  private handleError (error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error(errMsg);
    return Observable.throw(errMsg);
  }
}
