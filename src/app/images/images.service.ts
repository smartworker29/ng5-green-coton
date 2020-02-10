import { AlertsService, Alert } from '../ui/alerts.service';
import { environment } from 'environments/environment';
import { GlobalService } from '../services/global.service';
import { Headers, Http, Response } from '@angular/http';
import { Image } from './image';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/delayWhen';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/retryWhen';
import 'rxjs/add/observable/timer';

@Injectable()
export class ImagesService {
  private imagesUrl = environment.apiBaseUrl + '/api/v1/upload';
  private headers = new Headers({ 'Content-Type': 'application/json'});

  constructor(
    private http: Http,
    private alertsService: AlertsService,
    private globalService: GlobalService
  ) {}

  saveImage(image: Image): Observable<Response> {
    const retryCount = 1;
    return this.http.post(this.imagesUrl, JSON.stringify({filename: image.filename, image: image.dataUrl, type: 'upload'}), {headers: this.headers})
      .retryWhen(errors => {
        return errors
          .do(img => console.log('Failed to save image: %s' + img.filename))
          .delayWhen(img => Observable.timer(2 ** retryCount * 1000))
        ;
      })
      .map(res => {
        const json = res.json();
        if (!json || !json['status']) {
          throw image;
        }

        image.filename = json['filename'];
        image.saved = true;
      })
      .catch(this.handleError);
  }

  getImage(image: Image): Observable<Image> {
    const alert = this.alertsService.broadcast(new Alert({content: 'Fetching image...'}));
    let url = this.imagesUrl + '/' + image.filename;
    if (window['spoofSession']) {
      url += '?session_id=' + window['spoofSession'];
    }

    if (this.globalService.sharedDesignId) {
      url += '?shareId=' + this.globalService.sharedDesignId;
    }

    return this.http.get(url)
      .map(res => {
        this.alertsService.close(alert);
        const json = this.extractImageData(res);
        image.dataUrl = json['image'];
        return image;
      })
      .catch(this.handleError);
  }

  removeImage(image: Image): Observable<Response> {
    return this.http.delete(this.imagesUrl + '/' + image.filename)
      .map(res => { return res; })
      .catch(this.handleError);
  }

  private extractImageData(res: Response): object {
    return res.json();
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
    return Observable.throw(errMsg);
  }
}
