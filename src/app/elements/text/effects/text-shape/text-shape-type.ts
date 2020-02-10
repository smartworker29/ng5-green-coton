import { Color } from '../../../../colors/color';
import { Font } from '../../../../ui/font.interfaces';
import { Observable } from 'rxjs/Observable';
import { TextCanvas } from '../../canvas/text-canvas';
import { TextElement } from '../../text-element';

export class TextShapeType {
  public name: string;
  public adjust: number;
  public element: TextElement;
  public highResScale: number;
  protected cropImage = true;

  // delegate methods for convenience
  protected get fill(): Color { return this.element.fill; }
  protected get font(): Font { return this.element.font; }
  protected get letterSpacing(): number { return this.element.letterSpacing; }
  protected get text(): string { return this.element.text; }
  protected get textChanged(): boolean { return this.element.textChanged; }
  protected get width(): number { return this.element.width; }
  protected get height(): number { return this.element.height; }

  public createImage(): Observable<string> {
    return Observable.create((observer) => {
      this.createShape().subscribe((shapeCanvas) => {
        if (this.element.rotationDegrees) {
          shapeCanvas.rotate();
        }
        shapeCanvas.crop();

        observer.next(shapeCanvas.canvas.toDataURL());
        observer.complete();
      });
    });
  }

  protected createShape(): Observable<TextCanvas> {
    throw(new Error('subclass must implement createShape()'));
  }

  // returns a canvas element with all the text drawn on it, ready to be distorted by other Text Shapes
  protected getPlainTextCanvas(): Observable<TextCanvas> {
    return Observable.create((observer) => {
      new TextCanvas(this.element, this.highResScale).draw().subscribe(textCanvas => {
        observer.next(textCanvas);
        observer.complete();
      });
    });
  }
}
