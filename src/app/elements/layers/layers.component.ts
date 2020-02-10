import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Area } from '../../designs/area';
import { DesignsService } from '../../designs/designs.service';
import { DialogService, DialogRef } from '../../ui/dialog.service';
import { Subscription } from 'rxjs/Subscription';
import { Layer } from './layer';
import { SvgService } from '../../services/svg.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-layers',
  styleUrls: ['./layers.component.scss'],
  templateUrl: './layers.component.html',
})
export class LayersComponent implements OnDestroy, OnInit {
  public layers: Layer[] = [];
  private designsSubscription: Subscription;
  private currentArea: Area;
  private dialogRef: DialogRef;
  @ViewChild('layerEditor') layerEditor: TemplateRef<any>;


  constructor(
    private dialogService: DialogService,
    private svgService: SvgService,
    private designsService: DesignsService,
  ) {}

  ngOnInit() {
    // When an element is added/updated/removed, handle layers
    this.designsSubscription = this.designsService.events.subscribe(data => {
      switch (data.type) {
        case 'ADD_ELEMENT':
        case 'UPDATE_ELEMENT':
        case 'UPDATE_ELEMENT_LIKELY_PRICE_CHANGE':
        case 'REMOVE_ELEMENT':
          this.currentArea = data.payload.area;
          break;

        case 'CHANGE_DESIGN_SIDE':
          this.currentArea = data.payload.activeAreas[0];
          break;

        default:
          break;
      }

      if (this.currentArea) {
        this.updateLayers();
        this.openDialog();
      }
    });
  }

  openDialog() {
    this.dialogRef = this.dialogService.open(this.layerEditor, { name: 'layers', permanent: true, block: 2 });
  }

  showDialog() {
    this.dialogService.show(this.dialogRef);
  }

  hideDialog() {
    this.dialogService.hide(this.dialogRef);
  }

  ngOnDestroy() {
    this.designsSubscription.unsubscribe();
  }

  public moveUp(layer: Layer, event: Event): void {
    this.currentArea.moveElementUp(layer.elementReference);
    layer.elementReference.svgElement.forward();
    this.updateLayers();
    event.preventDefault();
  }

  public moveDown(layer: Layer, event: Event): void {
    this.currentArea.moveElementDown(layer.elementReference);
    layer.elementReference.svgElement.backward();
    this.updateLayers();
    event.preventDefault();
  }

  public selectLayer(layer: Layer, event: Event): void {
    layer.elementReference.clickHandler(layer.elementReference.selectableElement.node, false, event);
    layer.elementReference.selectableElement.fire('edit');
    event.preventDefault();
  }

  public removeLayer(layer: Layer, event: Event): void {
    if (confirm('Are you sure you want to delete this?')) {
      this.designsService.removeElement(this.currentArea, layer.elementReference);
      this.updateLayers();
    }
    event.preventDefault();
  }

  private updateLayers() {
    this.layers = this.currentArea.layers || [];
  }

  protected uniqColors(): string[] {
    return _.uniqBy(_.reject(_.flatten(_.map(this.layers, 'colors')), function(c) { return !c || c.id === 'GARMENT_COLOR'; }), 'rgb');
  }
}
