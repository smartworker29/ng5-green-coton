import { Headers, Http, Response } from '@angular/http';
import { AlertsService, Alert } from '../ui/alerts.service';
import { Area } from './area';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ColorsService } from '../colors/colors.service';
import { Color } from '../products/color';
import { Design } from './design';
import { DesignsEvent } from './designs-event';
import { environment } from 'environments/environment';
import { Element } from '../element';
import { GlobalService } from '../services/global.service';
import { ImagesService } from '../images/images.service';
import { Injectable } from '@angular/core';
import { JsZip } from 'jszip';
import { NameAndNumber } from '../elements/names-and-numbers/name-and-number';
import { Observable } from 'rxjs/Observable';
import { Product } from '../products/product';
import { ProductsService } from '../products/products.service';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Side } from './side';
import { Size } from './size';
import { Subject } from 'rxjs/Subject';
import { SvgService } from '../services/svg.service';
import * as _ from 'lodash';
import 'rxjs/add/observable/throw';

@Injectable()
export class DesignsService {

  designs: BehaviorSubject<Array<Design>>;
  selectedDesign: ReplaySubject<Design>;
  events = new ReplaySubject<DesignsEvent>();

  private _designs: Design[] = [];
  private designsUrl = environment.apiBaseUrl + '/api/v1/designs';
  private designUrl = environment.apiBaseUrl  + '/api/v1/designs';
  private cartUrl = environment.apiBaseUrl    + '/api/v1/cart';
  private orderUrl = environment.apiBaseUrl   + '/api/v1/order';
  private shareUrl = environment.apiBaseUrl   + '/api/v1/share';
  private headers = new Headers({ 'Content-Type': 'application/json'});

  constructor(
    private http: Http,
    private svgService: SvgService,
    private colorsService: ColorsService,
    private alertsService: AlertsService,
    private productsService: ProductsService,
    private imagesService: ImagesService,
    private globalService: GlobalService
  ) {
    this.selectedDesign = new ReplaySubject(1);
    this.designs = new BehaviorSubject(this._designs);
  }

  loadDesigns(): Observable<Design[]> {
    const alert = this.alertsService.broadcast(new Alert({content: 'Loading designs...', dismissIn: 5}));
    return this.http.get(this.designsUrl)
             .map(res => {
                this.alertsService.close(alert);
                this._designs = this.extractDesignsData(res);
                this.designs.next(this._designs);
                return this._designs;
              })
             .catch(this.handleError);
  }

  saveDesign(design: Design): Observable<string> {
    return Observable.create((observer) => {
      const alert = this.alertsService.broadcast(new Alert({content: 'Saving design...'}));
      const failureAlert = new Alert({content: 'We were unable to save your design. Please try again.', dismissIn: 5, type: 'danger'});
      design.thumbnail.subscribe(
        (thumbnail) => {
          design.thumbnailData = thumbnail;
          design.proof.subscribe(
            (proof) => {
              design.proofData = proof;
              this.saveDesignToStorage(design).subscribe(
                (response) => {
                  const id = response.json()['id'];
                  design.id = id;

                  // update or insert design into _designs array
                  const index: number = this._designs.findIndex((d) => d.id === design.id);
                  if (index !== -1) {
                    this._designs[index] = design;
                  } else {
                    this._designs.unshift(design);
                  }
                  this.designs.next(this._designs);
                  this.alertsService.close(alert);
                  design.hasUnsavedChanges = false;

                  observer.next(id);
                  observer.complete();
                },
                (error) => {
                  this.alertsService.close(alert);
                  this.alertsService.broadcast(failureAlert);
                  console.error('error saving design: %o', error);
                  observer.error('error saving design');
                },
              );
            },
            (error) => {
              this.alertsService.close(alert);
              this.alertsService.broadcast(failureAlert);
              console.error('error generating proof: %o', error)
              observer.error('error saving design');
            },
          );
        },
        (error) => {
          this.alertsService.close(alert);
          this.alertsService.broadcast(failureAlert);
          console.error('error generating design thumbnail: %o', error)
          observer.error('error saving design');
        }
      );
    });
  }

  shareDesign(design: Design): Observable<string> {
    return Observable.create((observer) => {
      const alert = this.alertsService.broadcast(new Alert({content: 'Preparing design for sharing...'}));
      design.thumbnail.subscribe(
        (thumbnail) => {
          design.thumbnailData = thumbnail;
          design.proof.subscribe(
            (proof) => {
              design.proofData = proof;
              this.shareDesignToStorage(design).subscribe(
                (response) => {
                  this.alertsService.close(alert);
                  const id = response.json()['id'];
                  design.hasUnsavedChanges = false;
                  observer.next(id);
                  observer.complete();
                },
                (error) => { console.error('error sharing design: %o', error); },
              );
            },
            (error) => console.error('error generating proof: %o', error),
          );
        },
        (error) => console.error('error generating design thumbnail: %o', error)
      );
    });
  }

  exportDesign(design: Design): Observable<JsZip> {
    return Observable.create((observer) => {
      const alert = this.alertsService.broadcast(new Alert({content: 'Exporting design...'}));
      design.export.subscribe((zip) => {
        this.alertsService.close(alert);
        observer.next(zip);
        observer.complete();
      });
    });
  }

  addToCart(design: Design, cartId: any = '') {
    if (design.totalQuantity === 0) {
      this.alertsService.broadcast(new Alert({
        dismissIn: 3,
        type: 'danger',
        content: 'Please enter a quantity before adding to the cart.'
      }));

      return;
    }

    if (design.totalQuantity < design.product.minimum) {
      this.alertsService.broadcast(new Alert({
        dismissIn: 3,
        type: 'danger',
        content: 'This production has a minimum quantity requirement of ' + design.product.minimum +'. Please increase the quantity before adding to the cart.'
      }));

      return;
    }

    const alert = this.alertsService.broadcast(new Alert({content: 'Adding to cart...'}));
    const failureAlert = new Alert({content: 'We were unable to add your design to your cart. Please try again.', dismissIn: 5, type: 'danger'});

    design.thumbnail.subscribe(
      (thumbnail) => {
        design.thumbnailData = thumbnail;
        design.proof.subscribe(
          (proof) => {
            design.proofData = proof;
            design.updatedAt = new Date().toISOString();

            this.saveDesign(design).subscribe((id) => {
              let cartUrl = this.cartUrl;

              if ( cartId ) {
                cartUrl += '/' + cartId;
              }

              if (this.globalService.sharedDesignId) {
                cartUrl += '?fromShare=' + this.globalService.sharedDesignId;
              }

              if (this.globalService.cartItemId && this.globalService.productId) {
                cartUrl += '?cartItemId=' + this.globalService.cartItemId;
              }

              this.http.post(cartUrl, JSON.stringify(design.toJson()), {headers: this.headers})
                .subscribe(
                  (res) => {
                    // TODO: get this cart url from config
                    this.alertsService.close(alert);
                    design.hasUnsavedChanges = false;
                    window.location.href = environment.cartUrl;
                  },
                  (error) => {
                    this.alertsService.close(alert);
                    this.alertsService.broadcast(failureAlert);
                    console.error('error adding to cart: %o', error);
                  },
                );
            });
          },
          (error) =>{
            console.error('error generating proof: %o', error);
            this.alertsService.close(alert);
            this.alertsService.broadcast(failureAlert);
          },
        );
      },
      (error) => {
        this.alertsService.close(alert);
        this.alertsService.broadcast(failureAlert);
        console.error('error generating design thumbnail: %o', error);
      }
    );
  }

  /* Entity-related actions */
  selectDesign(id: string) {
    const alert = this.alertsService.broadcast(new Alert({content: 'Loading design...'}));
    this.loadDesignFromStorage(id).subscribe(
      (design) => {
        if (design) {
          this.events.next(new DesignsEvent('LOAD_DESIGN', design));
          this.selectedDesign.next(design);
          this.alertsService.close(alert);
        }
      },
      (error) => console.error(error),
    );
  }

  loadSharedDesign(id: string) {
    const alert = this.alertsService.broadcast(new Alert({content: 'Loading shared design...'}));
    this.loadSharedDesignFromStorage(id).subscribe(
      (design) => {
        if (design) {
          this.events.next(new DesignsEvent('LOAD_DESIGN', design));
          this.selectedDesign.next(design);
          this.alertsService.close(alert);
        }
      },
      (error) => console.error(error),
    );
  }

  selectOrderItem(orderId: string, itemId: string) {
    const alert = this.alertsService.broadcast(new Alert({content: 'Loading design...'}));
    this.loadDesignFromOrder(orderId, itemId).subscribe(
      (design) => {
        if (design) {
          this.events.next(new DesignsEvent('LOAD_DESIGN', design));
          this.selectedDesign.next(design);
          this.alertsService.close(alert);
        }
      },
      (error) => console.error(error),
    );
  }

  selectCartItem(id: string) {
    const alert = this.alertsService.broadcast(new Alert({content: 'Loading design...'}));
    this.loadDesignFromCart(id).subscribe(
      (design) => {
        if (design) {
          this.events.next(new DesignsEvent('LOAD_DESIGN', design));
          this.selectedDesign.next(design);
          this.alertsService.close(alert);
        }
      },
      (error) => console.error(error),
    );
  }

  removeDesign(design: Design): any {
    // remove from internal array
    _.remove(this._designs, (d) => { return d.id === design.id; });

    // remove from storage
    const alert = this.alertsService.broadcast(new Alert({content: 'Removing design...'}));
    this.removeDesignFromStorage(design).subscribe(
      (res) => {
        // broadcast new designs list
        this.designs.next(this._designs);
        this.alertsService.close(alert);

        // select/load new design
        const newDesign = new Design(this.svgService.draw(), this, this.colorsService, this.productsService, this.imagesService);
        this.selectedDesign.next(newDesign);
      },
      (error) => console.error('error deleting design: %o', error)
    );
  }

  updateDesignProduct(design: Design, product: Product): Observable<Design> {
    return Observable.create((observer) => {
      const alert = this.alertsService.broadcast(new Alert({content: 'Changing product...'}));
      design.changeProduct(product).subscribe((d) => {
        this.alertsService.close(alert);
        this.changeSide(d, d.currentSide);
        this.selectedDesign.next(d);
        this.events.next(new DesignsEvent('CHANGE_DESIGN_PRODUCT', d));

        observer.next(d);
        observer.complete();
      });
    });
  }

  updateProductColor(design: Design, color: Color): Observable<Design> {
    return Observable.create((observer) => {
      design.changeProductColor(color).subscribe(() => {
        this.events.next(new DesignsEvent('CHANGE_PRODUCT_COLOR', design));
      });
      observer.next();
      observer.complete();
    });
  }

  updateDesignSizes(design: Design, sizes: Size[]) {
    design.updateSizes(sizes);
    this.events.next(new DesignsEvent('UPDATE_DESIGN', design));
  }

  updateNamesAndNumbers(design: Design, namesAndNumbers: NameAndNumber[]) {
    design = design.updateNamesAndNumbers(namesAndNumbers);
    this.events.next(new DesignsEvent('UPDATE_DESIGN', design));
  }

  changeSide(design: Design, side: Side) {
    design.showSide(side);
    this.unselectAllElements();
    this.events.next(new DesignsEvent('CHANGE_DESIGN_SIDE', side));
  }

  addElement(area: Area, element: Element) {
    area.addElement(element);
    this.events.next(new DesignsEvent('ADD_ELEMENT', element));
  }

  updateElement(area: Area, element: Element, likelyToAffectPricing = true) {
    area.updateElement(element);
    if (likelyToAffectPricing) {
      this.events.next(new DesignsEvent('UPDATE_ELEMENT_LIKELY_PRICE_CHANGE', element));
    } else {
      this.events.next(new DesignsEvent('UPDATE_ELEMENT', element));
    }
  }

  removeElement(area: Area, element: Element) {
    area.removeElement(element);
    this.events.next(new DesignsEvent('REMOVE_ELEMENT', element));
  }

  unselectAllElements() {
    this.svgService.draw().getSelected().selectify(false);
  }

  broadcastEvent(event: DesignsEvent) {
    this.events.next(event);
  }

  private loadDesignFromStorage(id: string): Observable<Design> {
    return this.http.get(this.designUrl + '/' + id)
                    .map((res) => { return this.extractDesignData(res); })
                    .catch(this.handleError);
  }

  private loadDesignFromCart(id: string): Observable<Design> {
    return this.http.get(this.cartUrl + '/' + id)
                    .map((res) => { return this.extractDesignData(res); })
                    .catch(this.handleError);
  }

  private loadDesignFromOrder(orderId: string, itemId: string): Observable<Design> {
    return this.http.get(this.orderUrl + '/' + orderId + '/' + itemId)
                    .map((res) => { return this.extractDesignData(res); })
                    .catch(this.handleError);
  }

  private loadSharedDesignFromStorage(id: string): Observable<Design> {
    return this.http.get(this.shareUrl + '/' + id)
                    .map((res) => { return this.extractDesignData(res); })
                    .catch(this.handleError);
  }

  private saveDesignToStorage(design: Design): Observable<Response> {
    design.updatedAt = new Date().toISOString();
    if (this.globalService.productId && this.globalService.cartItemId) { // They are savinga design to a new garment.
      design.resetId();
    }


    const body = JSON.stringify(design.toJson());

    let url = this.designUrl;
    if (design.id != null) {
      url += '/' + design.id;
    }

    if (this.globalService.sharedDesignId) {
      url += '?fromShare=' + this.globalService.sharedDesignId;
    }

    return this.http.post(url, body, {headers: this.headers});
  }

  private shareDesignToStorage(design: Design): Observable<Response> {
    design.updatedAt = new Date().toISOString();
    const body = JSON.stringify(design.toJson());
    return this.http.post(this.shareUrl, body, {headers: this.headers});
  }

  private removeDesignFromStorage(design: Design): Observable<Response> {
    return this.http.delete(this.designUrl + '/' + design.id)
                    .catch(this.handleError);
  }

  private extractDesignData(res: Response): Design {
    const json = res.json();
    return Design.newFromJson(json['design'], true, this.svgService.draw(), this, this.colorsService, this.productsService, this.imagesService);
  }

  private extractDesignsData(res: Response): Design[] {
    const json = res.json();
    if (json['designs']) {
      return res.json()['designs'].map((d) => {
        return Design.newFromJson(d, false, this.svgService.draw(), this, this.colorsService, this.productsService, this.imagesService);
      });
    } else {
      return [];
    }
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
