import { Http, Response } from '@angular/http';
import { Image } from './image';
import { ImagesService } from './images.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ImagesMockService extends ImagesService {
  saveImage(image: Image): Observable<Response> {
    return Observable.empty();
  }

  getImage(image: Image): Observable<Image> {
    return Observable.of(image);
  }

  removeImage(image: Image): Observable<Response> {
    return Observable.empty();
  }
}
