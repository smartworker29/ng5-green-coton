import { Injectable } from '@angular/core';

import { Color } from './color';
import { ColorsService } from './colors.service';
import { ColorsJson } from './fixtures/colors';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ColorsMockService extends ColorsService {

  getColors(): Observable<Color[]> {
    return Observable.create((observer) => {
      observer.next(this.extractColorData(ColorsJson));
      observer.complete();
    });
  }
}
