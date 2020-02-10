import { Component, TemplateRef, ViewChild } from '@angular/core';
import { AlertsService, Alert } from '../../ui/alerts.service';
import { Color } from '../../colors/color';
import { ColorsService } from '../../colors/colors.service';
import { DesignsService } from '../../designs/designs.service';
import { DialogService, DialogRef } from '../../ui/dialog.service';
import { Element } from '../../element';
import { ElementComponent } from '../element.component';
import { Image } from '../../images/image';
import { ImagesService } from '../../images/images.service';
import { ImageUploadElement } from './image-upload-element';
import { SvgService } from '../../services/svg.service';
import * as _ from 'lodash';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-image-upload',
  styleUrls: ['./image-upload.component.scss'],
  templateUrl: './image-upload.component.html',
})
export class ImageUploadComponent extends ElementComponent {
  private dialogRef: DialogRef;
  @ViewChild('newImageUploadDialog') newImageUploadDialog: TemplateRef<any>;
  @ViewChild('editImageUploadDialog') editImageUploadDialog: TemplateRef<any>;
  @ViewChild('imagePrintMethodDialog') imagePrintMethodDialog: TemplateRef<any>;
  uploadedImage: Image;
  availableColors: Color[];
  selectedColors: Color[] = [];
  transparentColor: Color;
  startTransparent: Boolean = false;

  constructor(
    private alertsService: AlertsService,
    protected dialogService: DialogService,
    protected designsService: DesignsService,
    protected svgService: SvgService,
    private colorsService: ColorsService,
    private imagesService: ImagesService,
    private sanitizer: DomSanitizer,
  ) {
    super(designsService, dialogService, svgService);
  }

  protected additionalOnInit() {
    this.colorsService.getColors().subscribe(colors => this.availableColors = colors);
  }

  openDialog(content) {
    this.dialogService.closeAll();
    this.dialogRef = this.dialogService.open(content, { name: 'image-upload', size: 'lg' });
  }

  edit(element: Element) {
    this.currentElement = element;
    this.imagesService.getImage(this.currentElement.image).subscribe((image) => {
      this.currentElement.image = image;
      this.dialogRef = this.dialogService.open(this.editImageUploadDialog, { name: 'image-upload', size: 'lg', block: 1, groups: ['edit-element'] });
      this.currentElement.render().subscribe();
    });
  }

  doneEditing() {
    if (this.dialogRef) {
      this.dialogService.close(this.dialogRef);
    }
    super.doneEditing();
  }


  addImage(printMethod: string) {
    this.dialogService.close(this.dialogRef);
    const area = this.currentDesign.currentArea;
    this.currentElement = new ImageUploadElement(area, this.uploadedImage);
    this.currentElement.printMethod = printMethod;

    switch (printMethod) {
      case 'single':
        this.currentElement.imageColors = [_.find(this.colorsService.loadedColors, { 'rgb': '#000000' })];
        break;

      case 'multi':
        this.currentElement.imageColors = this.selectedColors;
        this.selectedColors = [];
        break;

      case 'blackAndWhite':
        this.currentElement.imageColors = _.uniqBy(_.filter(this.colorsService.loadedColors, (c) => {
          return (c.rgb.toLowerCase() === '#000000' || c.rgb.toLowerCase() === '#ffffff');
        }), 'rgb');
        break;

      case 'color':
        this.currentElement.imageColors = _.uniqBy(_.filter(this.colorsService.loadedColors, (c) => {
          return (
            c.rgb.toLowerCase() === '#ffff7d'
            || c.rgb.toLowerCase() === '#1e3980'
            || c.rgb.toLowerCase() === '#522237'
            || c.rgb.toLowerCase() === '#000000'
          );
        }), 'rgb');
        break;
    }
    this.currentElement.render().subscribe(() => {
      this.currentElement.originImageData = this.currentElement.image.dataUrl;
      area.addElement(this.currentElement);
    });
  }

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  makeTransparent() {
    const alert = this.alertsService.broadcast(new Alert({
      content: 'Click and hold the area you\'d like to make transparent.',
      dismissable: true,
      dismissIn: 10
    }));

    this.startTransparent = true;
    (this.currentElement.selectableElement as any).selectify(false);
    var elem = this.currentElement;
    var dom = document.getElementById(this.currentElement.id);
    dom.classList.add("cursor-cross")
    const rect = dom.getBoundingClientRect();
    const screenXStart = rect.left;
    const screenYStart = rect.top;
    const width = rect.width;
    const height = rect.height;

    dom.addEventListener('mousedown', (e) => {
      dom.classList.remove("cursor-cross");
      if(this.startTransparent && this.currentElement && !this.currentElement.transparentColor) {
        const imageElement: HTMLImageElement = <HTMLImageElement> document.createElement('img');
        imageElement.onload = () => {
          const CANVAS_SCALE = 300 / 72;
          const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
          canvas.width = elem.convertedImage.width * CANVAS_SCALE;
          canvas.height = elem.convertedImage.height * CANVAS_SCALE;
          const context = canvas.getContext('2d');
          context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
          const x = e.x - screenXStart;
          const y = e.y - screenYStart;
          const canvasX = (Number)(x*canvas.width/width);
          const canvasY = (Number)(y*canvas.height/height);

          const data = context.getImageData(canvasX, canvasY, 1, 1).data;
          var c: Color = new Color();
          c.rgb = this.rgbToHex(data[0], data[1], data[2]);
          this.onChanges('transparentColor', c);
        }
        imageElement.src = elem.convertedImage.dataUrl;
      }
    }, true);
  }

  removeTransparent() {
    this.startTransparent = false;
    this.onChanges('transparentColor', null);
  }

  protected fileSelected($event) {
    const alert = this.alertsService.broadcast(new Alert({content: 'Uploading image...'}));
    const file: File = $event.target.files[0];
    const myReader: FileReader = new FileReader();


    const validImageTypes = ['image/gif', 'image/jpeg', 'image/png', 'application/postscript', 'image/tiff', ];

    const self = this;
    if (validImageTypes.indexOf(file.type) === -1) {
      this.dialogService.close(this.dialogRef);
      self.alertsService.close(alert);
      this.alertsService.broadcast(new Alert({
        content: 'Invalid file type chosen. Please choose a png, jpg, gif, eps, or svg.',
        dismissable: true,
        dismissIn: 10
      }));
    }

    myReader.onloadend = (e) => {
      this.uploadedImage = new Image();

      if (file.type === 'application/postscript' || file.type === 'image/tiff') {// if selected file is EPS
        const self = this;
        const formData = new FormData();
        formData.append('data', myReader.result);
        const req = new XMLHttpRequest();
        req.open('POST', environment.apiBaseUrl + '/api/v1/eps');
        req.onload = function(e) {
          self.uploadedImage.dataUrl = req.responseText;
          self.uploadedImage.filename = self.uniqueFilename(file.name);
          self.uploadedImage.setWidthAndHeight().subscribe(
            (success) => {
              self.imagesService.saveImage(self.uploadedImage).subscribe(() => {
                self.uploadedImage.dataUrl = req.responseText;
                self.dialogService.close(self.dialogRef);
                self.alertsService.close(alert);
                self.dialogRef = self.dialogService.open(self.imagePrintMethodDialog, { name: 'image-upload', size: 'lg' });
              });
            },
            (error) => {
              console.log('error setting width and height of uploaded image: %o', error);
            }
          );
        };
        req.send(formData);
      } else {
        this.uploadedImage.dataUrl = myReader.result;
        this.uploadedImage.filename = this.uniqueFilename(file.name);
        this.uploadedImage.setWidthAndHeight().subscribe(
          (success) => {
            this.imagesService.saveImage(this.uploadedImage).subscribe(() => {
              this.uploadedImage.dataUrl = myReader.result;
              this.dialogService.close(this.dialogRef);
              this.alertsService.close(alert);
              this.dialogRef = this.dialogService.open(this.imagePrintMethodDialog, { name: 'image-upload', size: 'lg' });
            });
          },
          (error) => {
            console.log('error setting width and height of uploaded image: %o', error);
          }
        );
      }
    };

    myReader.readAsDataURL(file);
  }

  protected beforeRemove() {
    if (this.dialogRef) {
      this.dialogService.close(this.dialogRef);
    }
  }

  protected modelClass(): string {
    return 'ImageUploadElement';
  }

  protected uniqueFilename(filename: string): string {
    /* NOTE: making filename unique across all user's designs
       while staying under 40 character limit
       * reserve 2 characters for convertedImage's filename
       * reserve 9 characters for design id
       * reserve 4 characters for extension
       * that leaves us 25 characters for original filename
    */
    const pieces = filename.split('.');
    const base = pieces.slice(0, -1).join('.');
    const ext = pieces[pieces.length - 1];

    const newFilename = this.currentDesign.id.substr(0, 8)
                      + '-'
                      + base.substr(0, 25)
                      + '.'
                      + ext;
    return newFilename;
  }
}
