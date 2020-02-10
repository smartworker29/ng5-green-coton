import { Injectable } from '@angular/core';

import { Font } from './font.interfaces';
import { FontPickerService } from './font-picker.service';
import { FontsJson } from './fixtures/fonts';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class FontPickerMockService extends FontPickerService {

  getAvailableGoogleFonts(filter?: string): Observable<Font[]> {
    return Observable.create((observer) => {
      observer.next(FontsJson.items.map(this.convertGoogleFont));
      observer.complete();
    });
  }
}
