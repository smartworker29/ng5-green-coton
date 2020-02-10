import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Design } from '../designs/design';
import { environment } from 'environments/environment';
import { Headers, Http } from '@angular/http';
import { Injectable } from '@angular/core';

@Injectable()
export class PricingService {
  private pricingUrl = environment.apiBaseUrl + '/api/v1/price';
  private cacheKey: string;
  private headers = new Headers({ 'Content-Type': 'application/json'});

  lineItems: BehaviorSubject<Array<PricingLineItem>>;
  private cachedLineItems: PricingLineItem[];

  constructor(private http: Http) {
    this.lineItems = new BehaviorSubject(new Array<PricingLineItem>());
  }

  public getPricing(design: Design) {
    if (!design.product) {
      return;
    }


    // TODO: We were caching here but caching a price based on sizes/qty/n&n only is wrong...
    // Layers, colors used, etc also affect the price

    // if (this.getCacheKey(design) === this.cacheKey) {
    //   this.lineItems.next(this.cachedLineItems);
    //   return;
    // }

    // this.cacheKey = this.getCacheKey(design);

    // save pricing result
    this.http.post(this.pricingUrl, JSON.stringify(design.toJson()), {headers: this.headers})
             .subscribe(
               (res) => {
                const lineItems = res.json().pricing.map((li) => {
                  const key = Object.keys(li)[0];
                  return new PricingLineItem(key, li[key]);
                });
                this.cachedLineItems = lineItems;
                this.lineItems.next(lineItems);
               },
               (error) => {
                  console.error('in pricingSvc.getPricing, error: %o', error);
               }
             );
  }

  getCacheKey(design: Design): string {
    return JSON.stringify({
      id: design.id,
      productId: design.productId,
      sizes: design.sizes.map(s => s.toJson()),
      qty: design.totalQuantity,
      namesAndNumbers: design.namesAndNumbers.reduce((total, curr) => {
          if (curr.name.length) { total += 1; }
          if (curr.number.length) { total += 1; }
          return total;
        }, 0),
    });
  }
}

export class PricingLineItem {
  label = '';
  value = '';

  constructor(label: string, value: string) {
    this.label = label;
    this.value = value;
  }
}
