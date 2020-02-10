import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { Category } from './category';
import { Clipart, Layer } from './clipart';
import { ColorsService } from '../../colors/colors.service';
import * as _ from 'lodash';

import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

@Injectable()
export class ClipartService {
  private clipartUrl = environment.apiBaseUrl + '/api/v1/cliparts';
  private clipartsUrl = environment.apiBaseUrl + '/api/v1/cliparts/categories';
  private clipartSearchUrl = environment.apiBaseUrl + '/api/v1/cliparts/search';

  public limit = 16;

  constructor(private http: Http, private colorsService: ColorsService) {}

   getCliparts(category: Category, page = 1): Observable<Clipart[]> {
    let url = this.clipartsUrl;
    if (category) {
      if (!category.parentId) {
        url = this.clipartUrl + '/popular';
      }
      url += '/' + category.id;
    }
    url += '?limit=' + this.limit + '&page=' + page;

    return this.http.get(url)
                    .map(res => { return this.extractClipartsData(res); })
                    .map(cliparts => {
                      return cliparts.sort(this.sortBySort)
                                      .filter((c) => !!c);
                    })
                    .catch(this.handleError);
  }

  search(term: string, page = 1): Observable<Clipart[]> {
    const url = this.clipartSearchUrl + '?q=' + term
                                 + '&limit=' + this.limit
                                 + '&page=' + page;
    return this.http.get(url)
                    .map(res => this.extractClipartsData(res))
                    .map(cliparts => cliparts.sort(this.sortBySort))
                    .catch(this.handleError);
  }

  getCategories(selectedCategory?: Category): Observable<Category[]> {
    const url = this.clipartsUrl;
    return this.http.get(url)
               .map((res) => {
                  return this.extractCategoryData(res)
                      .map((c, i, categories) => {
                        c.subcategories = categories.filter((sc) => sc.parentId === c.id);
                        return c;
                      })
                      .map((c, i, categories) => {
                        c.subcategories.sort(this.sortByTitle);
                        return c;
                      })
                      .filter((c) => {
                        if (selectedCategory) {
                          return c.parentId === selectedCategory.id;
                        }
                        return !c.parentId;
                      });
                })
                .map(categories => categories.sort(this.sortBySort))

               .catch(this.handleError);
  }

  getClipart(clipart: Clipart) {
    const url = this.clipartUrl + '/' + clipart.externalId;
    return this.http.get(url)
      .map((res) => { return this.extractClipartData(res); })
      .mergeMap((c) => {
        return Observable.forkJoin(c.layers.map((layer) => {
          return this.http.get(layer.url).map(res => { layer.svg = res.text(); return layer; });
        }));
      })
      .map((layers) => { clipart.layers = layers; return clipart; })
      .catch(this.handleError);
  }

  private extractCategoryData(res: Response): Category[] {
    const body = res.json();
    if (body) {
      return body.map((c) => this.buildCategoryFromJson(c));
    }
    return [];
  }

  private buildCategoryFromJson(c: any): Category {
    const category = new Category();
    category.id = c.id;
    category.title = c.name;
    category.parentId = c.parentId;
    category.sort = c.sort;
    return category;
  }

  private extractClipartsData(res: Response): Clipart[] {
    return res.json()
      .filter((c) => !!c)
      .map((c) => this.buildClipartFromJson(c));
  }

  private extractClipartData(res: Response): Clipart {
    return this.buildClipartFromJson(res.json());
  }

  protected buildClipartFromJson(c: any): Clipart {
    const clipart = new Clipart();
    clipart.externalId = c.id;
    clipart.title = c.name;
    clipart.sort = c.sort;
    clipart.imageUrl = c.imageUrl;
    if (c.layers) {
      c.layers.forEach((l) => {
        const layer = new Layer();
        layer.index = l.index;
        layer.fill = _.find(this.colorsService.loadedColors, { 'id': l.defaultColor });
        layer.name = l.name;
        layer.url = l.eps.replace(/eps$/, 'svg');
        clipart.layers.push(layer);
      });
    }
    return clipart;
  }

  private sortByTitle(a: Category, b: Category) {
    return ('' + a.title).localeCompare(b.title);
  }

  private sortBySort(a: Category|Clipart, b: Category|Clipart): number {
    if (a.sort < b.sort ) {
      return -1;
    }
    if (a.sort > b.sort ) {
      return 1;
    }
    return 0;
  }

  private handleError (error: Response | any) {
    // In a real world app, you might use a remote logging infrastructure
    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error('error in clipart service: %o', errMsg);
    return Observable.throw(errMsg);
  }
}
