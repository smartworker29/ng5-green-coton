import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { environment } from 'environments/environment';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/publishReplay';

import { Color } from './color';

@Injectable()
export class ColorsService {
  private colorsUrl = environment.apiBaseUrl + '/api/v1/inks';
  private namesAndNumbersColorsUrl = environment.apiBaseUrl + '/api/v1/names-and-numbers/inks';
  public loadedColors: Color[]; // this is initialized by AppComponent

  constructor(private http: Http) { }

  getColors(): Observable<Color[]> {
    return this.http.get(this.colorsUrl)
                     .map(res => this.extractColorData(res.json()))
                     .publishReplay(1)
                     .refCount()
                     .catch(this.handleError);
  }

  getNamesAndNumbersColors(): Observable<Color[]> {
      return this.http.get(this.namesAndNumbersColorsUrl)
                       .map(res => this.extractColorData(res.json()))
                       .catch(this.handleError);

  }

  protected extractColorData(json: any): Color {
    if (json.inks) {
      return json.inks.map((c) => {
        const color = new Color();
        color.id = c.id;
        color.name = c.name;
        color.rgb = '#' + c.rgb;
        return color;
      });
    }
    return null;
  }

  // TODO: DRY this method as it's duplicated between services
  private handleError(error: Response | any) {
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
