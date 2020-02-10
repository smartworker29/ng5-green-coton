import { Component, Input } from '@angular/core';
import { Color } from '../../../colors/color';
import { ColorsService } from '../../../colors/colors.service';
import { DropShadow } from './drop-shadow';
import { EffectComponent } from '../../effect.component';
import { TextElement } from '../text-element';
import { TextElementComponent } from '../text-element.component';
import * as _ from 'lodash';

const DROP_SHADOW_COLOR_ID = 22;

@Component({
  selector: 'app-drop-shadow',
  styles: [`
    :host {
      width: 100%;
      margin-bottom: 1em;
    }

    .effect-controls {
      margin-left: 0;
      margin-right: 0;
    }
  `],
  template: `
    <div class="text-effect-container">
      <label class="col-sm-12">
        Drop Shadow
        <input type="checkbox"
          class="pull-right"
          [ngModel]="effect.enabled"
          (ngModelChange)="onEffectChanges('enabled', $event)" />
      </label>
      <ng-template [ngIf]="effect.enabled">
        <div class="effect-controls row">
          <div class="col-sm-9">
            <label>Horizontal</label>
            <br>
            <input type="range"
              [ngModel]="effect.xOffset"
              (ngModelChange)="onEffectChanges('xOffset', $event)"
              min="-100" max="100" step="1"
              />
            <label>Vertical</label>
            <br>
            <input type="range"
              [ngModel]="effect.yOffset"
              (ngModelChange)="onEffectChanges('yOffset', $event)"
              min="-100" max="100" step="1"
              />
          </div>
          <div class="col-sm-3">
            <label>Color</label>
            <br>
            <app-color-picker
              class="text-color-picker selected-color"
              [selectedColor]="effect.color"
              [availableColors]="availableColors"
              (selectColor)="onSelectColor($event)"
            ></app-color-picker>
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class DropShadowComponent extends EffectComponent {
  @Input() element: TextElement;
  public effect: DropShadow;
  elementComponent: TextElementComponent;
  private availableColors: Color[];

  constructor(elementComponent: TextElementComponent, private colorsService: ColorsService) {
    super(elementComponent);
  }

  additionalOnInit() {
    this.availableColors = this.colorsService.loadedColors;

    if (!this.effect.color) {
      this.effect.color = _.find(this.colorsService.loadedColors, { 'id': DROP_SHADOW_COLOR_ID });
    }

    this.onEffectChanges('color', this.effect.color);
  }

  onEffectChanges(property: string, value: any) {
    if (property === 'enabled') {
      this.effect.enabled = value;
      if (value === false) {
        this.effect.removeEffect();
      }
    }
    super.onEffectChanges(property, value);
  }

  onSelectColor(color: Color) {
    if (color.id === 'GARMENT_COLOR') {
      color.rgb = this.elementComponent.getCurrentDesign().productColor.swatch();
    }
    this.onEffectChanges('color', color);
  }

  protected newEffect(): DropShadow {
    return new DropShadow();
  }

  protected effectClass(): string {
    return 'DropShadow';
  }

}
