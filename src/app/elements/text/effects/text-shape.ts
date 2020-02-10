import { Effect } from '../../effect';
import { Element } from '../../../element';
import { TextShapeFactory } from './text-shape/factory';

export class TextShape extends Effect {

  static newFromJson(json: object, element: Element): TextShape {
    const effect = new TextShape();
    effect.element = element;
    effect.fromJson(json);
    return effect;
  }

  constructor() {
    super();
    this.data['enabled'] = true;
    this.data['weight'] = 10;
  }

  get shapes(): string[] { return TextShapeFactory.shapeNames(); }

  get shape(): string { return this.data['shape']; }
  set shape(value: string) { this.data['shape'] = value; }

  get adjust(): number { return this.data['adjust']; }
  set adjust(value: number) { this.data['adjust'] = value; }

  public buildEffect() {
    return null;
  }

  get className(): string {
    return 'TextShape';
  }
}
