import { Injectable } from '@angular/core';

import { Clipart } from './clipart';
import { ClipartService } from './clipart.service';
import { IHeartClipart } from './fixtures/clipart';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ClipartMockService extends ClipartService {

  getClipart(clipart: Clipart) {
    return Observable.create((observer) => {
      observer.next(IHeartClipart);
      observer.complete();
    });
  }
}
