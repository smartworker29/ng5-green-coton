import { Component, TemplateRef, ViewChild } from '@angular/core';
import { Color } from '../../colors/color';
import { ColorsService } from '../../colors/colors.service';
import { DesignsService } from '../../designs/designs.service';
import { DialogService, DialogRef } from '../../ui/dialog.service';
import { Element } from '../../element';
import { ElementComponent } from '../element.component';
import { ShapeElement } from './shape-element';
import { ShapePickerComponent } from './shape-picker.component';
import { SvgService } from '../../services/svg.service';

@Component({
  selector: 'app-shape-element',
  styleUrls: ['./shape-element.component.scss'],
  template: `
    <div class="toolbar-item" (click)="openShapePicker()">
      <div class="toolbar-item-icon" [inlineSVG]="'assets/icons/shapes.svg'"></div>
      <label class="toolbar-item-title">
        Add Shape
      </label>
    </div>
    <app-shape-picker (selectedType)="new($event)"></app-shape-picker>
    <ng-template #shapeEditor let-c="close" let-d="dismiss">
      <div class="modal-header">
        <h4 class="modal-title">Edit Shape</h4>
        <button type="button" class="close" aria-label="Close" (click)="d('Cross click')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="row">
          <label class="col-sm-3">Fill</label>
          <div class="col-sm-9">
            <app-color-picker
              class="form-control-static"
              [selectedColor]="currentElement.fill"
              [availableColors]="availableColors"
              (selectColor)="onChanges('fill', $event)"
            ></app-color-picker>
          </div>
        </div>
        <div class="row small-gutter">
          <label class="col-sm-3">Flip</label>
          <div class="col-sm-9">
            <select [ngModel]="currentElement.flipAxis" (ngModelChange)="onChanges('flipAxis', $event)" class="form-control">
              <option value=''>None</option>
              <option value='x'>Horizontal</option>
              <option value='y'>Vertical</option>
            </select>
          </div>
        </div>
        <div *ngIf="currentElement" class="row">
          <app-transform [(element)]="currentElement" class="col-12"></app-transform>
        </div>
        <hr>
        <div class="row">
          <app-outline [(element)]="currentElement"></app-outline>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-danger btn-sm" (click)="remove()">
          <i class="fa fa-trash"></i>
          Remove
        </button>
      </div>
    </ng-template>
  `
})
export class ShapeElementComponent extends ElementComponent {
  private availableColors: Color[];
  @ViewChild('shapeEditor') editDialog: TemplateRef<any>;
  @ViewChild(ShapePickerComponent) shapePickerComponent: ShapePickerComponent;
  private dialogRef: DialogRef;

  constructor(
    protected dialogService: DialogService,
    protected designsService: DesignsService,
    protected svgService: SvgService,
    private colorsService: ColorsService,
  ) {
    super(designsService, dialogService, svgService);
  }

  protected additionalOnInit() {
    this.colorsService.getColors().subscribe(colors => this.availableColors = colors);
  }

  openShapePicker() {
    this.dialogService.closeAll();
    this.shapePickerComponent.open();
  }

  new(type: string) {
    const area = this.currentDesign.currentArea;
    this.currentElement = new ShapeElement(area, type);
    this.currentElement.fill = this.availableColors[0];
    this.currentElement.render().subscribe(() => {
      this.designsService.addElement(area, this.currentElement);
    });
  }

  edit(element: Element) {
    this.currentElement = element;
    this.dialogRef = this.dialogService.open(this.editDialog, { name: 'shape-element', size: 'lg', block: 1, groups: ['edit-element'] });
  }

  doneEditing() {
    if (this.dialogRef) {
      this.dialogService.close(this.dialogRef);
    }
    super.doneEditing();
  }


  protected beforeRemove() {
    if (this.dialogRef) {
      this.dialogService.close(this.dialogRef);
    }
  }

  protected modelClass(): string {
    return 'ShapeElement';
  }
}
