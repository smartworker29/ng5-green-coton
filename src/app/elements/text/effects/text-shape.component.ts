import { Component, Input } from '@angular/core';
import { EffectComponent} from '../../effect.component';
import { TextElement } from '../text-element';
import { TextElementComponent } from '../text-element.component';
import { TextShape } from './text-shape';

@Component({
  selector: 'app-text-shape',
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
    <div>
      <label class="col-sm-12">
        <input type="checkbox"
          [checked]="enabled"
          (change)="onEnabledChange($event)"
          class="pull-right"
          />
        Text Shape
      </label>
      <ng-template [ngIf]="enabled">
        <div class="row effect-controls">
          <div class="col-12">
            <label>Shape</label>
            <select [ngModel]="element.shapeName" (ngModelChange)="onEffectChanges('shapeType', $event)">
              <option *ngFor="let shape of effect.shapes" [ngValue]="shape">{{shape}}</option>
            </select>
          </div>
          <div class="col-12">
            <label>Shape Adjust:</label> <span #adjustValue>{{adjustDisplay()}}%</span>
            <input type="range" min="-50" max="150" step="5"
              [ngModel]="element.shapeAdjust"
              (ngModelChange)="onEffectChanges('shapeAdjust', $event)"
              />
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
export class TextShapeComponent extends EffectComponent {
  @Input() element: TextElement;
  public effect: TextShape;
  public enabled = false;
  elementComponent: TextElementComponent;

  constructor(elementComponent: TextElementComponent) {
    super(elementComponent);
  }

  additionalOnInit() {
    if (this.element) {
      this.enabled = this.element.shapeName !== 'plain';
    }
  }

  adjustDisplay(): string {
    const displayAmount = this.element.shapeAdjust - 50;
    if (displayAmount > 0) {
      return '+' + displayAmount;
    }
    return displayAmount.toString();
  }

  onEnabledChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.enabled = target.checked;
    if (this.enabled) {
      this.element.shapeName = this.effect.shapes[0];
      this.element.shapeAdjust = 75;
    } else {
      this.element.shapeName = 'plain';
    }
    this.element.render().subscribe();
  }

  // overriding because we're manipulating element properties directly
  onEffectChanges(property: string, value: any) {
    switch (property) {
      case 'shapeType': {
        this.element.shapeName = value;
        break;
      }
      case 'shapeAdjust': {
        this.element.shapeAdjust = value;
        break;
      }
    }
    this.element.render().subscribe();
  }

  protected newEffect(): TextShape {
    return new TextShape();
  }

  protected effectClass(): string {
    return 'TextShape';
  }
}
