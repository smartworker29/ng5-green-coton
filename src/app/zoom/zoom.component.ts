import { Component, OnInit, OnDestroy } from '@angular/core';
import { Design } from '../designs/design';
import { DesignsService } from '../designs/designs.service';
import { Subscription } from 'rxjs/Subscription';
import { SvgService } from '../services/svg.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-zoom',
  styles: [`
    .zoom-wrapper {
      display: block;
      position: relative;
      left: 5px;
      width: 220px;
      margin: 0 auto;
      z-index: 10;
    }
    .zoom-wrapper input {
      position: relative;
      left: 20px;
      width: 150px;
      height: 20px;
    }
    .switch-sides {
      position: absolute;
      top: 5px;
      left: -40px;
      height: 30px;
      width: 30px;
      cursor: pointer;
    }
    .plus, .minus {
      position: absolute;
      cursor: pointer;
    }
    /deep/ .plus > svg, /deep/ .minus > svg {
      fill: #096ba1;
      color: #096ba1;
    }
    .plus, .minus {
      width: 10px;
      height: 10px;
    }
    .plus { top: 6px; right: 37px; }
    .minus { top: 2px; left: 7px; }
    @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) { /* IE10+ CSS styles */
      input {
        padding: 0;
      }
      .minus {
        top: 4px;
      }
    }
  `],
  template: `
    <div (window:resize)="onZoomChange(zoom)" class="zoom-wrapper">
      <div *ngIf="currentDesign && currentDesign.activeSides.length > 1"
        class="switch-sides"
        [inlineSVG]="'assets/icons/switch-sides.svg'"
        (click)="onSwitchSides()" >
      </div>
      <div (click)="increase()" class="plus" [inlineSVG]="'assets/icons/plus.svg'"></div>
      <div>
        <input type="range" [min]="min" [max]="max" [step]="step"
          [value]="zoom"
          (change)="onZoomChange($event.target.value)"
          (input)="onZoomChange($event.target.value)"
          >
      </div>
      <div (click)="decrease()" class="minus" [inlineSVG]="'assets/icons/minus.svg'"></div>
    </div>
  `,
})
export class ZoomComponent implements OnInit, OnDestroy {
  zoom: number;
  currentDesign: Design;
  private designsSubscription: Subscription;
  private originalViewbox: any;
  min = 50;
  max = 200;
  step = 10;

  constructor(private svgService: SvgService, private designsService: DesignsService) {
    this.zoom = 100;
  }

  ngOnInit() {
    this.designsSubscription = this.designsService.selectedDesign.subscribe((design) => {
      this.currentDesign = design;
      this.originalViewbox = this.svgService.draw().viewbox();
      this.onZoomChange(this.zoom);
    });
  }

  onZoomChange(scale: number) {
    scale = Math.min(scale, this.max);
    scale = Math.max(scale, this.min);
    this.zoom = scale;
    scale = scale / 100;

    if ( typeof this.originalViewbox === 'undefined') {
      return;
    }

    const newX = this.originalViewbox.width * (scale - 1) / 4;
    const newY = this.originalViewbox.height * ((scale - 1) / 2.0) / 4.0;

    this.svgService.draw().viewbox({ x: newX, y: newY, width: this.originalViewbox.width, height: this.originalViewbox.height});
    const dom = document.getElementById('container');
    const subDom = document.getElementById('subcontainer');
    const originW = dom.offsetWidth;
    subDom.style.width = `${originW*scale}px`;
    subDom.style.height = `${originW*8/6*scale}px`;
    // this.svgService.draw().width(100 * scale + '%').height(100 * scale + '%');
  }

  increase() {
    this.onZoomChange(this.zoom + this.step);
  }

  decrease() {
    this.onZoomChange(this.zoom - this.step);
  }

  onSwitchSides() {
    const index = _.findIndex(this.currentDesign.activeSides, { name: this.currentDesign.currentSide.name });
    const nextIndex = (index + 1) % this.currentDesign.activeSides.length;

    const nextSide = this.currentDesign.activeSides[nextIndex];
    this.designsService.changeSide(this.currentDesign, nextSide);
  }

  ngOnDestroy() {
    if (this.designsSubscription) {
      this.designsSubscription.unsubscribe();
    }
  }
}
