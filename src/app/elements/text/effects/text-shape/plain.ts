import { Observable } from 'rxjs/Observable';
import { TextShapeType } from './text-shape-type';

export class Plain extends TextShapeType {
  public name = 'plain';
  protected cropImage = false;

  public createImage(): Observable<string> {

    return Observable.create((observer) => {
      this.getPlainTextCanvas().subscribe((shapeCanvas) => {
        if (this.element.rotationDegrees) {
          shapeCanvas.rotate();
        }
        shapeCanvas.crop();

        observer.next(shapeCanvas.canvas.toDataURL());
        observer.complete();
      });
    });
  }
}
