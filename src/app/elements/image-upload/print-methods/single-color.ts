import { Color } from '../../../colors/color';
import { Image } from '../../../images/image';
import { ImageUploadElement } from '../image-upload-element';
import { Observable } from 'rxjs/Observable';

const CANVAS_SCALE = 300 / 72;

export class SingleColor {
  static convert(element: ImageUploadElement, threshold: number): Observable<Image> {
    return Observable.create((observer) => {
      const imageElement: HTMLImageElement = <HTMLImageElement> document.createElement('img');

      imageElement.onload = () => {
        const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
        canvas.width = element.convertedImage.width * CANVAS_SCALE;
        canvas.height = element.convertedImage.height * CANVAS_SCALE;
        const context = canvas.getContext('2d');
        context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

        const imageData: ImageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const len = data.length;
        const rgb = element.imageColors[0].toRgb();
        for (let p = 0; p < len; p += 4) {
          if (data[p + 3] === 0) {
            continue;
          }
          if ((data[p] + data[p + 1] + data[p + 2]) < threshold) {
            data[p + 0] = rgb[0];
            data[p + 1] = rgb[1];
            data[p + 2] = rgb[2];
          } else {
            data[p + 3] = 0;
          }
        }
        context.putImageData(imageData, 0, 0);
        element.convertedImage.dataUrl = canvas.toDataURL();
        element.convertedImage.filename = 's-' + element.image.filename;

        observer.next(element.convertedImage);
        observer.complete();
      };

      imageElement.onerror = () => {
        console.error('error loading imageElment');
        observer.error(new Error('error loading imageElement'));
      };

      if (typeof element.image.dataUrl === 'undefined') {
        imageElement.src = element.convertedImage.dataUrl;
      } else {
        imageElement.src = element.image.dataUrl;
      }
    });
  }
}
