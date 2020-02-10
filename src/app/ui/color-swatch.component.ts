import { Component, Input } from '@angular/core';
import { Color } from '../colors/color';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-color-swatch',
  styles: [`
    .color-swatch {
      border-radius: 50%;
      border: 3px solid #e3e7eb;
      cursor: pointer;
      height: 28px;
      overflow: hidden;
      position: relative;
      width: 28px;
      float: left;
      margin: 2px;
    }
    .color-swatch.active,
    .color-swatch:hover {
      border: 3px solid #777;
    }
    .multi-color-swatch {
      height: 28px;
      float: left;
    }
  `],
  template: `
    <ng-template [ngIf]="color && color.display">
      <div
        *ngIf="color.display.length <= 1 && (color.display.length == 0 || color.display[0].type === 'hex')"
        class="color-swatch"
        [class.active]="active"
        [style.background]="color.rgb"
        >
      </div>

      <div
        *ngIf="color.display.length <= 1 && color.display.length && color.display[0].type === 'image'"
        class="color-swatch"
        [class.active]="active"
        [style.background-image]="getImageStyle(color.display[0].value)"
        >
      </div>

      <div
        *ngIf="color.display.length > 1"
        class="color-swatch multi-color-swatch"
        [class.active]="active"
        >

        <ng-container *ngFor="let display of color.display">
          <div *ngIf="display.type === 'hex'"
            [style.background-color]="display.value"
            [style.width]="(100 / color.display.length) + '%'"
            class="multi-color-swatch"
            >
          </div>
          <div *ngIf="display.type === 'image'"
            [style.background-image]="getImageStyle(display.value)"
            [style.width]="(100 / color.display.length) + '%'"
            class="multi-color-swatch"
            >
          </div>
        </ng-container>
      </div>
    </ng-template>
  `,
})
export class ColorSwatchComponent {
  @Input() color: Color;
  @Input() active = false;

  constructor(private sanitizer: DomSanitizer) {
  }

  getImageStyle(url) {
    return this.sanitizer.bypassSecurityTrustStyle('url("' + url + '")');
  }
}
