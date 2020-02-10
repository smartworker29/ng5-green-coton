import { environment } from 'environments/environment';
import { Http, Response } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class CookiesService {

  private cookiesUrl = environment.apiBaseUrl + '/api/v1/cookies';
  public cookies = {};

  constructor(private http: Http) {}

  getCookies(): Observable<object> {
    return this.http.get(this.cookiesUrl)
             .map(res => {
               this.cookies = res.json();
               return res.json();
             })
             .catch(this.handleError);
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
    console.error('error %s: %o', errMsg, error);
    return Observable.throw(errMsg);
  }
}
