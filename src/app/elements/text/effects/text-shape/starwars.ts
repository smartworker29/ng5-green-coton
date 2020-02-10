import { Observable } from 'rxjs/Observable';
import { TextCanvas } from '../../canvas/text-canvas';
import { TextShapeType } from './text-shape-type';
import { TranslateMatrix } from '../../../../models/translate-matrix';

export class Starwars extends TextShapeType {
  public name = 'starwars';

  protected createShape(): Observable<TextCanvas> {
    return Observable.create((observer) => {
      this.getPlainTextCanvas().subscribe(textCanvas => {
        const canvas = textCanvas.canvas;
        const distortAmount: number = (((this.adjust / 100 * 2)) - 1) / 2;

        const bitmapWidth = canvas.width;
        const bitmapHeight = canvas.height;
        const bitmapWidthAdjusted = bitmapWidth + (bitmapWidth * Math.abs(distortAmount));

        const tmpCanvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
        tmpCanvas.width = bitmapWidthAdjusted;
        tmpCanvas.height = bitmapHeight;
        const context = tmpCanvas.getContext('2d');

        let drawLocY = 0;
        const translateMatrix = new TranslateMatrix();

        const distDec = -distortAmount;
        while (drawLocY <= bitmapHeight) {
          translateMatrix.ty = drawLocY;

          if (distDec >= 0) {
            // Scale the x to create the slope
            translateMatrix.a = ( ((drawLocY / (bitmapHeight / -distDec) ) * 2) + 1 + distDec);

          } else {
            translateMatrix.a = ( (( (bitmapHeight - drawLocY) / (bitmapHeight / distDec) ) * 2) + 1 - distDec);
          }
          // Position the x so that the slope is at the top
          translateMatrix.tx = bitmapWidthAdjusted * .5 - (bitmapWidth * translateMatrix.a * .5);

          context.drawImage(canvas, 0, drawLocY, bitmapWidth, 1, translateMatrix.tx, drawLocY, canvas.width * translateMatrix.a, 1);

          drawLocY++;
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
