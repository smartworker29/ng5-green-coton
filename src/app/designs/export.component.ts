import { Component, Input } from '@angular/core';
import { Design } from './design';
import { DesignsService } from './designs.service';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-design-export',
  styles: [`
  `],
  template: `
    <button type="button" class="col btn btn-sm btn-secondary" (click)="onExport()">Export</button>
    <button type="button" class="col btn btn-sm btn-secondary" (click)="onProof()">Proof</button>
  `,
})
export class ExportComponent {
  @Input() currentDesign: Design;

  constructor(
    private designsService: DesignsService,
  ) {}

  onExport() {
    const design = this.currentDesign;
    this.designsService.exportDesign(design).subscribe((zip) => {
      zip.generateAsync({type: 'blob'}).then(function(content) {
        saveAs(content, 'export-' + design.id + '.zip');
      });
    });
  }

  onProof() {
    const design = this.currentDesign;
    design.proof.subscribe(imageData => {
      saveAs(this.dataUriToBlob(imageData), 'proof-' + design.id + '.png');
    });
  }

  dataUriToBlob(dataUri: string): Blob {
    let byteString = null;

    if (dataUri.split(',')[0].indexOf('base64') >= 0) {
      byteString = window.atob(dataUri.split(',')[1]);
    } else {
      byteString = decodeURIComponent(dataUri.split(',')[1]);
    }

    // separate out the mime component
    const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];

    // convert to byte Array
    const array = [];
    for (let i = 0; i < byteString.length; i++) {
      array.push(byteString.charCodeAt(i));
    }

    return new Blob([new Uint8Array(array)], {type: mimeString});
  }
}


