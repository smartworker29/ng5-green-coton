import { Component, TemplateRef, ViewChild } from '@angular/core';
import { Clipart, Layer } from './clipart';
import { ClipartBrowserComponent } from './clipart-browser.component';
import { ClipartElement } from './clipart-element';
import { Color } from '../../colors/color';
import { ColorsService } from '../../colors/colors.service';
import { DesignsService } from '../../designs/designs.service';
import { DialogService, DialogRef } from '../../ui/dialog.service';
import { Element } from '../../element';
import { ElementComponent } from '../element.component';
import { SvgService } from '../../services/svg.service';

@Component({
  selector: 'app-clipart',
  styleUrls: ['./clipart.component.scss'],
  templateUrl: './clipart.component.html',
})
export class ClipartComponent extends ElementComponent {
  private availableColors: Color[];
  private dialogRef: DialogRef;

  @ViewChild('clipartEditor') editDialog: TemplateRef<any>;
  @ViewChild(ClipartBrowserComponent) browserDialog: ClipartBrowserComponent;

  constructor(
    protected dialogService: DialogService,
    protected designsService: DesignsService,
    protected svgService: SvgService,
    private colorsService: ColorsService
  ) {
    super(designsService, dialogService, svgService);
  }
  additionalOnInit() {
    this.colorsService.getColors().subscribe(colors => this.availableColors = colors);
  }

  openBrowser() {
    this.browserDialog.open();
  }

  new(clipart: Clipart) {
    this.createAndRender(clipart);
  }

  edit(element: Element) {
    this.currentElement = element;
    this.dialogRef = this.dialogService.open(this.editDialog, {name: 'clipart', block: 1, groups: ['edit-element'] });
  }

  doneEditing() {
    if (this.dialogRef) {
      this.dialogService.close(this.dialogRef);
    }
    super.doneEditing();
  }

  onLayerChanges(layer: Layer, property: string, value: any) {
    layer[property] = value;
    this.currentElement.render().subscribe(() => {
      this.designsService.updateElement(this.currentDesign.currentArea, this.currentElement);
    });
  }

  private createAndRender(clipart: Clipart) {
    const area = this.currentDesign.currentArea;
    this.currentElement = new ClipartElement(area, this.colorsService, clipart);
    this.currentElement.render().subscribe(() => {
      this.designsService.addElement(area, this.currentElement);
    });
  }

  protected beforeRemove() {
    if (this.dialogRef) {
      this.dialogService.close(this.dialogRef);
    }
  }

  protected modelClass(): string {
    return 'ClipartElement';
  }
}
