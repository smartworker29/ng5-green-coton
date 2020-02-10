import { Observable } from 'rxjs/Observable';

export class Image {
  dataUrl: string;
  file: File;
  width: number;
  height: number;
  filename: string;
  saved = false;

  static fromJson(json: object): Image {
    const image = new Image();
    image.dataUrl = json['dataUrl'];
    image.file = json['file'];
    image.width = json['width'];
    image.height = json['height'];
    image.filename = json['filename'];
    image.saved = true;
    return image;
  }

  setWidthAndHeight(): Observable<void> {
    return Observable.create((observer) => {
      if (this.width && this.height) {
        observer.next();
        observer.complete();
      }

      if (!this.dataUrl) {
        observer.error('dataUrl was blank');
        observer.complete();
      }

      const img = document.createElement('img');
      const self = this;
      img.onload = function() {
        self.width = img.width;
        self.height = img.height;
        observer.next();
        observer.complete();
      };
      img.src = this.dataUrl;
    });
  }
}
