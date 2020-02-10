import { Component, ViewChild, TemplateRef } from '@angular/core';
import { Color } from '../../colors/color';
import { ColorsService } from '../../colors/colors.service';
import { DesignsService } from '../../designs/designs.service';
import { DialogService, DialogRef } from '../../ui/dialog.service';
import { Element } from '../../element';
import { ElementComponent } from '../element.component';
import { Font } from '../../ui/font.interfaces';
import { FontPickerService } from '../../ui/font-picker.service';
import { SvgService } from '../../services/svg.service';
import { TextElement } from './text-element';

@Component({
  selector: 'app-text-element',
  styleUrls: ['./text-element.component.scss'],
  template: `
    <div class="toolbar-item" (click)="new()" *ngIf="ready">
      <div class="toolbar-item-icon" [inlineSVG]="'assets/icons/text.svg'"></div>
      <label class="toolbar-item-title">
        Add Text
      </label>
    </div>
    <ng-template #textEditor let-c="close" let-d="dismiss">
      <div class="modal-header">
        <h4 class="modal-title">Edit Text</h4>
        <button type="button" class="close" aria-label="Close" (click)="d('Cross click')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div *ngIf="showBasic()">
          <div class="row">
            <div class="form-group col-sm-12">
              <textarea [ngModel]="currentElement.text" (ngModelChange)="onChanges('text', $event)" class="form-control" >
              </textarea>
            </div>
          </div>
          <div class="row small-gutter">
            <div class="font-container">
              <label>Font</label><br>
              <app-ui-font-picker
                *ngIf="currentElement.font"
                [text]="currentElement.text"
                [font]="currentElement.font"
                (fontChange)="onChanges('font', $event)"
                >
              </app-ui-font-picker>
            </div>
            <div class="color-container">
              <label>Color</label><br>
              <app-color-picker
                class="text-color-picker selected-color"
                [selectedColor]="currentElement.fill"
                [availableColors]="availableColors"
                (selectColor)="onChanges('fill', $event)"
              ></app-color-picker>
            </div>
          </div>
          <app-transform [(element)]="currentElement"></app-transform>
          <button type="button" class='btn pull-right btn-secondary' (click)="toggleShowEffects($event);">Text Effects</button>
        </div>
        <div *ngIf="showEffects()">
          <button type="button" (click)="toggleShowEffects($event);" class='btn pull-right btn-secondary'>Back</button>
          <br />
          <div class="row">
            <label class="col-sm-12">Text Effects:</label>
          </div>
          <hr>
          <div class="row">
            <app-text-shape [(element)]="currentElement"></app-text-shape>
          </div>
          <hr>
          <div class="row">
            <app-outline [(element)]="currentElement"></app-outline>
          </div>
          <hr>
          <div class="row">
            <app-outline-two [(element)]="currentElement"></app-outline-two>
          </div>
          <hr>
          <div class="row">
            <app-drop-shadow [(element)]="currentElement"></app-drop-shadow>
          </div>
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
export class TextElementComponent extends ElementComponent {
  private availableColors: Color[];
  private dialogRef: DialogRef;
  @ViewChild('textEditor') editDialog: TemplateRef<any>;
  private maxCharsPerLine = 50;
  ready = false;
  defaultFont: Font = null;
  _showEffects = false;

  constructor(
    protected dialogService: DialogService,
    protected designsService: DesignsService,
    protected svgService: SvgService,
    private colorsService: ColorsService,
    private fontService: FontPickerService,
  ) {
    super(designsService, dialogService, svgService);
  }

  protected additionalOnInit() {
    // make sure we have colors, defaultFont, and design written to svg before showing
    this.colorsService.getColors().subscribe((colors) => {
      this.availableColors = colors;
      this.fontService.getFont(this.fontService.defaultFontFamily()).subscribe((font) => {
        this.defaultFont = font;
        this.ready = true;
      });
    });
  }

  new() {
    // go ahead and draw a default Text element
    const area = this.currentDesign.currentArea;
    this.currentElement = new TextElement(area);
    this.currentElement.fill = this.availableColors[0];
    this.currentElement.editing = true;
    this.currentElement.font = this.defaultFont;
    this.currentElement.textChanged = true;
    this.currentElement.render().subscribe(() => {
      this.designsService.addElement(area, this.currentElement);
    });
  }

  edit(element: Element) {
    this.currentElement = element;
    this._showEffects = false;
    this.dialogRef = this.dialogService.open(this.editDialog, {name: 'text-element', size: 'lg', block: 1, groups: ['edit-element'] });
  }

  doneEditing() {
    if (this.dialogRef) {
      this.dialogService.close(this.dialogRef);
    }
    super.doneEditing();
  }

  showEffects() {
    return this._showEffects;
  }

  showBasic() {
    return !this._showEffects;
  }

  toggleShowEffects(event: any) {
    this._showEffects = !this._showEffects;
    event.stopPropagation();
  }

  onChanges(property: string, value: any) {
    if (property === 'text') {
      value = this.enforceMaxCharsPerLine(value);
      this.currentElement.textChanged = true;
    } else if (property === 'font') {
      this.currentElement.textChanged = true;
      this.currentElement.lineSpacing = null;
    }
    super.onChanges(property, value);
  }

  getCurrentDesign() {
    return this.currentDesign;
  }

  protected beforeRemove() {
    if (this.dialogRef) {
      this.dialogService.close(this.dialogRef);
    }
  }

  protected modelClass(): string {
    return 'TextElement';
  }

  private enforceMaxCharsPerLine(value): string {
    const lines = value.split(/(\r\n|\n|\r)/gm);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > this.maxCharsPerLine) {
        lines[i] = lines[i].substring(0, this.maxCharsPerLine)
          + '\n' + lines[i].substring(this.maxCharsPerLine, lines[i].length);
      }
    }
    return lines.join('');
  }
}
