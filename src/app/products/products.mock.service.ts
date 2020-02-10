import { Injectable } from '@angular/core';

import { ProductsService } from './products.service';
import { DefaultProductJson } from './fixtures/default-product';
import { Observable } from 'rxjs/Observable';
import { Product } from './product';
import { Response } from '@angular/http';

@Injectable()
export class ProductsMockService extends ProductsService {

  getProduct(id: string): Observable<Product> {
    return Observable.create((observer) => {
      observer.next(this.extractProductData(DefaultProductJson));
      observer.complete();
    });
  }
}
