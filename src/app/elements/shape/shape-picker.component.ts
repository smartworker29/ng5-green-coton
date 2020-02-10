import { Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { DialogService, DialogRef } from '../../ui/dialog.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ShapeElement } from './shape-element';

@Component({
  selector: 'app-shape-picker',
  styles: [`
    .shape-container {
      text-align: center;
      cursor: pointer;
    }
  `],
  template: `
    <ng-template #shapePicker let-c="close" let-d="dismiss">
      <div class="modal-header">
        <h4 class="modal-title">Add a Shape</h4>
        <button type="button" class="close" aria-label="Close" (click)="d('Cross click')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="row">
          <div *ngFor="let shape of shapes"
            class="col-6 shape-container"
            (click)="new(shape)"
            >
            <div [innerHTML]="shapeImages[shape]"></div>
            <div class="shape-label">{{shape}}</div>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class ShapePickerComponent implements OnInit {
  @Output() selectedType = new EventEmitter<string>();
  @ViewChild('shapePicker') shapePicker: TemplateRef<any>;
  private dialogRef: DialogRef;
  private shapes = [];
  private shapeImages = {};

  constructor(
    private dialogService: DialogService,
    private domSanitizer: DomSanitizer,
  ) {
    this.shapes = ['ellipse', 'rectangle', 'heart', 'star', 'triangle'];
  }

  ngOnInit() {
    this.shapes.forEach((shape) => {
      this.shapeImages[shape] = this.svgForType(shape);
    });
  }

  new(type: string) {
    this.selectedType.emit(type);
    this.close();
  }

  open() {
    this.dialogRef = this.dialogService.open(this.shapePicker, { name: 'shape-picker', size: 'lg' });
  }

  close() {
    this.dialogService.close(this.dialogRef);
  }

  svgForType(type: string): SafeHtml {
    var svg = document.createElement('svg');
    svg.setAttribute('width', '80');
    svg.setAttribute('height', '80');
    svg.setAttribute('viewBox', this.viewboxForType(type));
    svg.appendChild(ShapeElement.forType(type).node);
    return this.domSanitizer.bypassSecurityTrustHtml(svg.outerHTML); 
  }

  viewboxForType(type: string): string {
    switch (type) {
      case 'ellipse':
        return '-150 -150 300 300';
      case 'rectangle':
        return '-50 -100 300 300';
      case 'heart':
        return '0 0 400 300';
      case 'star':
        return '-30 -20 200 200';
      case 'triangle':
        return '-25 20 300 300';
      default:
        return '0 0 300 300';
    }
  }
}

