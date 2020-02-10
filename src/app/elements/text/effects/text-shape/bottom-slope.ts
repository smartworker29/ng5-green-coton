import { Observable } from 'rxjs/Observable';
import { TextCanvas } from '../../canvas/text-canvas';
import { TextShapeType } from './text-shape-type';
import { TranslateMatrix } from '../../../../models/translate-matrix';

export class BottomSlope extends TextShapeType {
  public name = 'bottomslope';

  protected createShape(): Observable<TextCanvas> {
    return Observable.create((observer) => {
      this.getPlainTextCanvas().subscribe(textCanvas => {
        const canvas = textCanvas.canvas;
        const distortAmount: number = (((this.adjust / 100 * 2)) - 1) / 2;

        const bitmapWidth = canvas.width;
        const bitmapHeight = canvas.height;
        const bitmapHeightAdjusted = bitmapHeight + (bitmapHeight * Math.abs(distortAmount));

        const tmpCanvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
        tmpCanvas.width = bitmapWidth;
        tmpCanvas.height = bitmapHeightAdjusted;
        const context = tmpCanvas.getContext('2d');

        const distDec = distortAmount;
        let drawLocX = 0;
        const translateMatrix = new TranslateMatrix();

        while (drawLocX <= bitmapWidth) {
          // Draw the columns to the bitmap
          translateMatrix.tx = drawLocX;

          if (distDec >= 0) {
            // Scale the y to create the slope
            translateMatrix.d = ( (( (bitmapWidth - drawLocX) / (bitmapWidth / distDec) ) * 2) + 1 - distDec);
          } else {
            // Scale the y to create the slope
            translateMatrix.d = ( ((drawLocX / (bitmapWidth / -distDec) ) * 2) + 1 + distDec);
          }

          context.drawImage(canvas, drawLocX, 0, 1, canvas.height, drawLocX, 0, 1, canvas.height * translateMatrix.d);

          drawLocX++;
        }

        // we may have increased Canvas size, so redrawing to fit element's original size
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = canvas.width;
        scaledCanvas.height = canvas.height;
        const scaledContext = scaledCanvas.getContext('2d');
        scaledContext.drawImage(tmpCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

        textCanvas.canvas = scaledCanvas;
        textCanvas.context = scaledContext;

        observer.next(textCanvas);
        observer.complete();
      });
    });
  }
}
