import { Observable } from 'rxjs/Observable';
import { TextCanvas } from '../../canvas/text-canvas';
import { TextShapeType } from './text-shape-type';
import { TranslateMatrix } from '../../../../models/translate-matrix';

export class Bulge extends TextShapeType {
  public name = 'bulge';

  protected createShape(): Observable<TextCanvas> {
    return Observable.create((observer) => {
      this.getPlainTextCanvas().subscribe((textCanvas) => {
        const canvas = textCanvas.canvas;
        const distortAmount: number = (((this.adjust / 100 * 2)) - 1) / 2;

        const bitmapWidth = canvas.width;
        const bitmapHeight = canvas.height;
        const bitmapHeightAdjusted = bitmapHeight + (bitmapHeight * Math.abs(distortAmount));

        const tmpCanvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
        tmpCanvas.width = bitmapWidth;

        if (distortAmount >= 0) {
          tmpCanvas.height = bitmapHeight + (bitmapHeight * Math.abs(distortAmount) * 2);
        } else {
        tmpCanvas.height = bitmapHeight + (bitmapHeight * Math.abs(distortAmount));
        }

        const context = tmpCanvas.getContext('2d');

        const translateMatrix = new TranslateMatrix();
        let drawLocX = 0;

        while (drawLocX <= bitmapWidth) {
          const distDec = Math.abs(distortAmount);
          const curveX = drawLocX - (bitmapWidth * .5);
          const sWidth = bitmapWidth * 1.5;

          let sHeight = 0;

          if (distortAmount >= 0) {
            sHeight = distDec * 11.5;
            translateMatrix.d = (1 - distDec * 9.5)
                                + Math.sqrt(
                                  (-(sHeight * sHeight) / ((sWidth * .5) * (sWidth * .5)) * curveX * curveX)
                                  + (sHeight * sHeight)
                                );
            translateMatrix.ty = (bitmapHeightAdjusted * .55)
                                + (bitmapHeightAdjusted * distDec * .20)
                                - (bitmapHeight * translateMatrix.d * .5);
          } else {
            sHeight = distDec * 6.25;
            translateMatrix.d = 1 + (distDec * 5.5)
                                - Math.sqrt(
                                  (-(sHeight * sHeight) / ((sWidth * .5) * (sWidth * .5)) * curveX * curveX)
                                  + (sHeight * sHeight)
                                );
            translateMatrix.ty = (bitmapHeightAdjusted * .5) - (bitmapHeight * translateMatrix.d  * .5);
          }

          translateMatrix.tx = drawLocX;

          context.drawImage(canvas, drawLocX, 0, 1, canvas.height, drawLocX, translateMatrix.ty, 1, canvas.height * translateMatrix.d);
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
