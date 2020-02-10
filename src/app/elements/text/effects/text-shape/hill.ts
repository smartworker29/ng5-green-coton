import { Observable } from 'rxjs/Observable';
import { TextCanvas } from '../../canvas/text-canvas';
import { TextShapeType } from './text-shape-type';
import { TranslateMatrix } from '../../../../models/translate-matrix';

export class Hill extends TextShapeType {
  public name = 'hill';

  protected createShape(): Observable<TextCanvas> {
    return Observable.create((observer) => {
      this.getPlainTextCanvas().subscribe((textCanvas) => {
        const canvas = textCanvas.canvas;
        const distortAmount: number = ((this.adjust / 100 * 2)) - 1;

        const bitmapWidth = canvas.width;
        const bitmapHeight = canvas.height;
        const bitmapHeightAdjusted =  bitmapHeight + (bitmapHeight * Math.abs(distortAmount));

        const tmpCanvas: HTMLCanvasElement = <HTMLCanvasElement> document.createElement('canvas');
        tmpCanvas.width = bitmapWidth;
        tmpCanvas.height = bitmapHeight + (bitmapHeight * Math.abs(distortAmount * 1.5));
        const context = tmpCanvas.getContext('2d');

        const translateMatrix = new TranslateMatrix();
        let drawLocX = 0;

        while (drawLocX <= bitmapWidth) {
          let distDec = distortAmount;
          translateMatrix.ty = drawLocX;
          const curveX = drawLocX - (bitmapWidth * .5);
          const sWidth = bitmapWidth * 1.5;
          const sHeight = distDec * 6;

          if (distortAmount <= 0) {
            distDec = -distortAmount;
            // Position the y to create the slope
            translateMatrix.ty = bitmapHeightAdjusted - (
                                  bitmapHeight * (
                                    1 + (distDec * 5.5) - Math.sqrt(
                                      (-(sHeight * sHeight) / ((sWidth * .5) * (sWidth * .5)) * curveX * curveX) + (sHeight * sHeight)
                                    )
                                  )
                                );
          } else {
            // Position the y to create the slope
            translateMatrix.ty = (
              bitmapHeight * (
                (distDec * 6)
                - Math.sqrt(
                  (-(sHeight * sHeight) / ((sWidth * .5) * (sWidth * .5)) * curveX * curveX) + (sHeight * sHeight)
                )
              )
            );
          }
          context.drawImage(canvas, drawLocX,
                            0, 1, canvas.height, drawLocX,
                            translateMatrix.ty, 1, canvas.height);
          drawLocX++;
        }
        textCanvas.canvas = tmpCanvas;

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
