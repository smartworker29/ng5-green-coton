import { Component, OnInit, OnDestroy } from '@angular/core';
import { Design } from '../../designs/design';
import { DesignsService } from '../../designs/designs.service';
import { Distress } from './distress';
import { Side } from '../../designs/side';
import { Subscription } from 'rxjs/Subscription';
import { SvgService } from '../../services/svg.service';

@Component({
  selector: 'app-distress',
  template: `
    <div class="toolbar-item" (click)="toggleDistress()">
      <div class="toolbar-item-icon" [inlineSVG]="'assets/icons/distress.svg'"></div>
      <label class="toolbar-item-title">
        Distress
      </label>
    </div>
  `
})
export class DistressComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  private design: Design;
  private currentSide: Side;
  private distressForSide: { [name: string]: Distress } = {};

  constructor(private svgService: SvgService, private designsService: DesignsService) { }

  ngOnInit() {
    this.subscription = this.designsService.events.subscribe((data) => {
      switch (data.type) {
        case 'LOAD_DESIGN': {
          this.currentSide = data.payload.currentSide
          this.initializeSides(data.payload);
          break;
        }
        case 'CHANGE_DESIGN_PRODUCT': {
          this.currentSide = data.payload.currentSide
          this.initializeSides(data.payload);
          break;
        }
        case 'CHANGE_DESIGN_SIDE': {
          this.currentSide = data.payload;
          this.initializeAndRender();
          break;
        }
      }
    });
  }

  toggleDistress() {
    this.onEnabledChanged(!this.currentSide.distressed);
  }

  onEnabledChanged(value: boolean) {
    this.currentSide.distressed = value;
    this.distressForSide[this.currentSide.name].currentSide.distressed = value;
    this.distressForSide[this.currentSide.name].render();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private initializeAndRender() {
    if (!this.design || !this.design.currentSide || !this.currentSide) {
      return;
    }

    this.distressForSide[this.currentSide.name].render();
  }

  private initializeSides(design: Design) {
    // preload distress data
    Distress.distressDataUri().subscribe(() => {
      this.design = design;
      this.design.sides.forEach((side: Side) => {
        this.distressForSide[side.name] = new Distress(this.designsService, this.svgService);
        this.distressForSide[side.name].currentSide = side;
        this.initializeAndRender();
      });
    });
  }
}
