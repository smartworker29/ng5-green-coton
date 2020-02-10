import { DesignsService } from '../../designs/designs.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/Observable';
import { Side } from '../../designs/side';
import { SvgService } from '../../services/svg.service';
import * as SVG from 'svg.js';
import * as request from 'request';

export class Distress {
  static _dataUrl: string;
  public currentSide: Side;
  private mask: any;
  private filterAlpha: any;

  static distressDataUri(): Observable<string> {
    return Observable.create((observer) => {

      // Return cached result since this is an expensive call
      if (this._dataUrl) {
        observer.next(this._dataUrl);
        observer.complete();
      }

      const self = this;
      const headers = { 'Cache-Control': 'no-cache'};
      request({uri: environment.assetUrl + 'assets/web-distress-for-DS_at_100__zoom.jpg', headers: headers, encoding: null}, function(err, res, data) {
        if (err) {
          console.error(err);
          observer.error(err);
        } else {
          data = 'data:' + res.headers['content-type'] + ';base64,' + data.toString('base64');
          self._dataUrl = data;
          observer.next(data);
        }
        observer.complete();
      });
    });
  }

  constructor(protected designsService: DesignsService, protected svgService: SvgService) {}

  public render() {
    if (!this.currentSide || !this.currentSide.svgElement) {
      return;
    }

    // Pre-build mask even if side isn't distressed for faster initial loading
    this.buildMask().subscribe((mask) => {
      if (this.currentSide.distressed) {
        this.currentSide.areas.forEach((area) => area.distressContainer.maskWith(mask));
      } else {
        this.currentSide.areas.forEach((area) => area.distressContainer.unmask());
      }
    });
  }

  private buildMask(): Observable<any> {
    return Observable.create((observer) => {

      // avoid building a new mask if it already exists
      const mask = SVG.get('#distress_mask');
      if (mask) {
        this.mask = mask;
        observer.next(this.mask);
        observer.complete();
        return;
      }

      const side = this.currentSide.svgElement;

      this.filterAlpha = this.svgService.draw().filter(function(add) {
        add.componentTransfer({ rgb: { type: 'table', tableValues: [0, 1] } });
      });

      Distress.distressDataUri().subscribe((imageDataUri) => {
        this.mask = side.mask().attr('id', 'distress_mask');
        this.mask.image(imageDataUri).attr('fill', this.filterAlpha).width(556).height(693);

        observer.next(this.mask);
        observer.complete();
      });
    });
  }
};
