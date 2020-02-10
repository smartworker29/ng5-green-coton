import { Color } from '../../../colors/color';
import { Image } from '../../../images/image';
import { ImageUploadElement } from '../image-upload-element';
import { Observable } from 'rxjs/Observable';

const CANVAS_SCALE = 300 / 72;

export class BlackAndWhite {
  static convert(element: ImageUploadElement): Observable<Image> {
    return Observable.create((observer) => {
      const imageElement: HTMLImageElement = <HTMLImageElement> document.createElement('img');

      imageElement.onload = function() {
        const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
        canvas.width = element.convertedImage.width * CANVAS_SCALE;
        canvas.height = element.convertedImage.height * CANVAS_SCALE;
        const context = canvas.getContext('2d');
        context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

        const imageData: ImageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const len = data.length;
        for (let p = 0; p < len; p += 4) {
          // Get the average of the r,g,b values to find right shade of gray
          const average = (data[p + 0] + data[p + 1] + data[p + 2]) / 3;
          data[p] = data[p + 1] = data[p + 2] = average;
        }
        context.putImageData(imageData, 0, 0);
        element.convertedImage.dataUrl = canvas.toDataURL();
        element.convertedImage.filename = 'b-' + element.image.filename;

        observer.next(element.convertedImage);
        observer.complete();
      };

      imageElement.onerror = function() {
        console.error('error loading imageElment');
        observer.error(new Error('error loading imageElement'));
      };

      imageElement.src = element.convertedImage.dataUrl;
    });
  }
}
