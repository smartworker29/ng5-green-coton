import { environment } from 'environments/environment';
import { Font } from './font.interfaces';
import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as WebFont from 'webfontloader';
import * as _ from 'lodash';

@Injectable()
export class FontPickerService {
  private apiKey = 'AIzaSyAKqk-DVN6jXC85bKxOCK1wuqB35AkFKl0';
  private googleUrl = 'https://www.googleapis.com/webfonts/v1/webfonts';
  private fontsUrl = environment.apiBaseUrl + '/api/v1/fonts';
  private cachedFonts = {};
  private loadedFonts = [];

  constructor( private http: Http ) {}

  public defaultFontFamily(): string {
    return 'Anton';
  }

  public getAvailableFonts(): Observable<FontFromApi[]> {
    return this.http.get(this.fontsUrl)
                    .map(res => res.json()['fonts'])
                    .catch(this.handleHttpError);
    ;
  }

  public getAvailableGoogleFonts(filter?: string): Observable<Font[]> {
    return Observable.create((observer) => {
      this.getAvailableFonts()
        .map((fonts) => filter ? fonts.filter(font => font[filter] === 1) : fonts)
        .subscribe((fonts) => {
          this.listAllFonts('popularity').subscribe(
            (googleFonts) => {
              observer.next(
                googleFonts
                  .filter(gf => fonts.find(f => f.name === gf.family))
                  .map(gf => {
                    // use the category from BC to set the font category
                    const f = fonts.find(font => font.name === gf.family);
                    gf.category = f.category;
                    return gf;
                  })
                  .map(this.convertGoogleFont)
              );
              observer.complete();

            },
          );
        },
        (err) => observer.error('Error getting available fonts'),
      );
    });
  }

  /*
    Return all fonts avaliable from google fonts, may have sort parameter:
    date || alpha || style || trending || popularity
  */
  public listAllFonts(sort: string): Observable<Font[]> {
    let requestUrl = this.googleUrl + '?key=' + this.apiKey;

    if (sort) {
      requestUrl = requestUrl.concat('&sort=' + sort);
    }

    return <Observable<Font[]>> this.http.get(requestUrl)
      .map((data) => data.json().items.map((font) => this.convertGoogleFont(font)))
      .catch(this.handleHttpError);
  }

  public getFont(family: string): Observable<Font> {
    return Observable.create((observer) => {
      if (this.cachedFonts[family]) {
        observer.next(this.cachedFonts[family]);
        observer.complete();
      } else {
        this.getAvailableGoogleFonts().subscribe(
          (fonts) => {
            const font = _.find(fonts, {'family': family });
            if (font) {
              this.cachedFonts[family] = font;
              observer.next(font);
              observer.complete();
            } else {
              observer.error('Couldn\'t find font: %o', family);
            }
          },
          (error) => {
            observer.error('Error loading font information.');
          }
        );
      }
    });
  }

  public loadFonts(fonts: Array<string>): Observable<Array<string>> {
    return Observable.create((observer) => {
      const groups = _.chunk(fonts, 20);
      const self = this;
      groups.forEach((group) => {
        const families = group.filter((font) => font.length && !_.includes(self.loadedFonts, font));
        if (families.length) {
          WebFont.load({
            google: { families: families },
            fontactive: (familyName, fvd) => {
              self.loadedFonts.push(familyName);
              observer.next([familyName]);
              observer.complete();
            },
          });
        } else {
          observer.next(families);
          observer.complete();
        }
      });
    });
  }

  /*
    Return observable of the requested font
  */

  public getRequestedFont(family: string): Observable<Font> {
    const requestUrl = 'https://fonts.googleapis.com/css?family=' + family;

    return <Observable<Font>> this.http.get(requestUrl)
      .map(res => res.json())
      .catch(this.handleHttpError);
  }

  /*
    Handler for possible http request errors
  */

  private handleHttpError(error: any) {
    const errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';

    return Observable.throw(errMsg);
  }

  protected convertGoogleFont(font: any): Font {
    const convertedFont = new Font({
      category: font.category,
      family: font.family,
      styles: font.variants,
      files: font.files,
      style: null,
      size: null
    });

    return convertedFont as Font;
  }
}

interface FontFromApi {
  name: string;
  category: string;
  names_and_numbers: boolean;
}
