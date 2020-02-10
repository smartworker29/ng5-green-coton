import { Element } from '../element';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class ElementService {
  private subject = new Subject<{type: string, element: Element}>();
  private _elements: Element[] = [];

  getObservable(): Observable<any> {
    return this.subject.asObservable();
  }

  elements(): Element[] {
    return this._elements;
  }
}
