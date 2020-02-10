import { Component, Input } from '@angular/core';
import { EffectComponent } from '../../effect.component';
import { Transform } from './transform';
import { ImageUploadElement } from '../image-upload-element';
import { ImageUploadComponent } from '../image-upload.component';

@Component({
  selector: 'app-transform',
  styleUrls: ['./transform.component.scss'],
  template: `
    <div class="row">
      <div class="col-12">
        <label>Constrain</label>
        <input type="checkbox" [(ngModel)]="constrain" />
      </div>
      <div class="precision-col">
        <app-ui-precision-range
          label="W"
          uom='&Prime;'
          conversionType="pixelsPerInch"
          [conversionFactor]="element.area.side.pixelsPerInch"
          [min]="1"
          [max]="element.area.svgElement.width()"
          [step]="element.area.side.pixelsPerInch / 4"
          [value]="element.width"
          (onChange)="onEffectChanges('width', $event)"
        ></app-ui-precision-range>
      </div>
      <div class="precision-col">
        <app-ui-precision-range
          label="H"
          uom='&Prime;'
          conversionType="pixelsPerInch"
          [conversionFactor]="element.area.side.pixelsPerInch"
          [min]="1"
          [max]="element.area.svgElement.height()"
          [step]="element.area.side.pixelsPerInch / 4"
          [value]="element.height"
          (onChange)="onEffectChanges('height', $event)"
        ></app-ui-precision-range>
      </div>
    </div>
    <div class="row">
      <div class="precision-col">
        <label>Rotate</label>
        <app-ui-precision-range
          uom='&deg;'
          [min]="-359"
          [max]="359"
          [step]="1"
          [value]="element.rotationDegrees"
          (onChange)="onEffectChanges('rotationDegrees', $event)"
        ></app-ui-precision-range>
      </div>
    </div>
    <br />
    <div class="row">
      <div class="col-12 text-center">
        <div class="btn-group" role="group">
          <button type="button" class="btn btn-secondary pull-left" (click)="element.resetRotation()">Reset Rotation</button>
          <button type="button" class="btn btn-secondary pull-left" (click)="element.center()">Center</button>
          <button type="button" class="btn btn-secondary pull-left" (click)="elementComponent.duplicate()">Duplicate</button>
        </div>
      </div>
      <br><br>
    </div>
  `,
})
export class TransformComponent extends EffectComponent {
  @Input() element: ImageUploadElement;
  public effect: Transform;
  elementComponent: ImageUploadComponent;
  constrain = true;

  constructor(elementComponent: ImageUploadComponent) {
    super(elementComponent);
  }

  protected newEffect(): Transform {
    return new Transform();
  }

  protected effectClass(): string {
    return 'Transform';
  }

  onEffectChanges(property: string, value: any) {
    if (property === 'height') {
      const scaleH = value / this.element.height;
      const scaleW = this.constrain ? scaleH : 1;

      this.element.scale(scaleW, scaleH);

    } else if (property === 'width') {
      const scaleW = value / this.element.width;
      const scaleH = this.constrain ? scaleW : 1;

      this.element.scale(scaleW, scaleH);

    } else if (property === 'rotationDegrees') {
      this.element.rotate(value);
    }
    super.onEffectChanges(property, value);
  }
}
