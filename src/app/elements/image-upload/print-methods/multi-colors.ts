import { Color } from '../../../colors/color';
import { Image } from '../../../images/image';
import { ImageUploadElement } from '../image-upload-element';
import { Observable } from 'rxjs/Observable';

const CANVAS_SCALE = 300 / 72;

export class MultiColors {
  static convert(element: ImageUploadElement, transparentColor: Color, threshold: number): Observable<Image> {
    return Observable.create((observer) => {
      const imageElement: HTMLImageElement = <HTMLImageElement> document.createElement('img');

      imageElement.onload = () => {
        const range = (des: number, src: number, threshold: number) => {
          if(des > src-threshold && des < src+threshold) return true;
          return false;
        }

        const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
        canvas.width = element.image.width * CANVAS_SCALE;
        canvas.height = element.image.height * CANVAS_SCALE;
        const context = canvas.getContext('2d');
        context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

        const imageData: ImageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const len = data.length;
        if(transparentColor) {
          if(typeof transparentColor.toRgb !== 'function') {
            const rgb = transparentColor.rgb;
            transparentColor = new Color;
            transparentColor.rgb = rgb;
          }
          const rgb = transparentColor.toRgb();
          for (let p = 0; p < len; p += 4) {
            if(range(data[p], rgb[0], threshold) &&
              range(data[p + 1], rgb[1], threshold) &&
              range(data[p + 2], rgb[2], threshold))
              data[p + 3] = 0;
          }
        }
        context.putImageData(imageData, 0, 0);
        element.convertedImage.dataUrl = canvas.toDataURL();
        element.convertedImage.filename = 'c-' + element.image.filename;

        observer.next(element.convertedImage);
        observer.complete();
      };

      imageElement.onerror = () => {
        console.error('error loading imageElment');
        observer.error(new Error('error loading imageElement'));
      };

      if (element.originImageData)
        imageElement.src = element.originImageData;
      else
      // if (typeof element.image.dataUrl === 'undefined') {
        imageElement.src = element.convertedImage.dataUrl;
      // } else {
        // imageElement.src = element.image.dataUrl;
      // }
    });
  }
}
