import { Observable } from 'rxjs/Observable';
import { TextCanvas } from '../../canvas/text-canvas';
import { TextShapeType } from './text-shape-type';
import { TranslateMatrix } from '../../../../models/translate-matrix';

export class Railroad extends TextShapeType {
  public name = 'railroad';

  protected createShape(): Observable<TextCanvas> {
    return Observable.create((observer) => {
      this.getPlainTextCanvas().subscribe(textCanvas => {
        const canvas = textCanvas.canvas;
        const distortAmount: number = (((this.adjust / 100 * 2)) - 1);

        const bitmapWidth = canvas.width;
        const bitmapHeight = canvas.height;
        const bitmapHeightAdjusted =  bitmapHeight + (bitmapHeight * Math.abs(distortAmount));

        const tmpCanvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
        tmpCanvas.width = bitmapWidth;
        tmpCanvas.height = bitmapHeightAdjusted;
        const context = tmpCanvas.getContext('2d');

        const translateMatrix = new TranslateMatrix();
        let drawLocX = 0;

        while (drawLocX <= bitmapWidth) {
          const distDec = distortAmount >= 0 ? distortAmount : -distortAmount;
          const curveX = drawLocX - (bitmapWidth * .5);
          const sWidth = bitmapWidth * 1.5;
          const sHeight = distDec * 6;

          translateMatrix.tx = drawLocX;
          translateMatrix.d = 1
                              + (distDec * 5.5)
                              - Math.sqrt(
                                (-(sHeight * sHeight) / ((sWidth * .5) * (sWidth * .5)) * curveX * curveX)
                                + (sHeight * sHeight)
                              );

          translateMatrix.ty = distortAmount >= 0 ? 0 : bitmapHeightAdjusted - (bitmapHeight * translateMatrix.d);

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
