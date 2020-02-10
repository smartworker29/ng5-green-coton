import { Component, Input } from '@angular/core';
import { Color } from '../../../colors/color';
import { ColorsService } from '../../../colors/colors.service';
import { EffectComponent} from '../../effect.component';
import { ShapeOutline } from './shape-outline';
import { ShapeElement } from '../shape-element';
import { ShapeElementComponent } from '../shape-element.component';

@Component({
  selector: 'app-outline',
  styles: [`
    .effect-controls {
      margin-left: 0;
      margin-right: 0;
    }
  `],
  template: `
    <div>
      <label class="col-sm-12">
        Outline
        <input type="checkbox"
          [ngModel]="effect.enabled"
          (ngModelChange)="onEffectChanges('enabled', $event)"
          />
      </label>
    </div>
    <ng-template [ngIf]="effect.enabled">
      <div class="effect-controls row small-gutter">
        <div class="col-sm-8">
          <label>Thickness</label>
          <input type="range" min="15" max="100" step="5"
            [ngModel]="effect.thickness"
            (ngModelChange)="onEffectChanges('thickness', $event)"
            />
        </div>
        <div class="col-sm-3">
          <label>Color</label>
          <app-color-picker
            class="form-control-static"
            [selectedColor]="effect.color"
            [availableColors]="availableColors"
            (selectColor)="onSelectColor($event)"
            >
          </app-color-picker>
        </div>
      </div>
    </ng-template>
  `,
})
export class ShapeOutlineComponent extends EffectComponent {
  @Input() element: ShapeElement;
  public effect: ShapeOutline;
  elementComponent: ShapeElementComponent;
  private availableColors: Color[];

  constructor(elementComponent: ShapeElementComponent, private colorsService: ColorsService) {
    super(elementComponent);
  }

  additionalOnInit() {
    this.availableColors = this.colorsService.loadedColors;

    if (!this.effect.color) {
      // pick first available color which isn't already being used
      const usedColors = this.element.colors();
      const color = this.availableColors.find((c) => {
        if (!usedColors.find((uc) => uc.id === c.id)) {
          return true;
        }
      });
      this.onSelectColor(color);
    }
  }

  onSelectColor(color: Color) {
    this.onEffectChanges('color', color);
  }

  protected newEffect(): ShapeOutline {
    return new ShapeOutline();
  }

  protected effectClass(): string {
    return 'ShapeOutline';
  }
}
