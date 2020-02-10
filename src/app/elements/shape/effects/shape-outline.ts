import { Color } from '../../../colors/color';
import { Effect, EffectBox } from '../../effect';
import { Element } from '../../../element';

export class ShapeOutline extends Effect {

  static newFromJson(json: object, element: Element): ShapeOutline {
    const effect = new ShapeOutline();
    effect.element = element;
    effect.fromJson(json);
    effect.color = Color.fromJson(effect.color);
    return effect;
  }

  constructor() {
    super();
    this.data['weight'] = 20;
    this.data['thickness'] = 30;
  }

  get thickness(): number { return this.data['thickness']; }
  set thickness(value: number) { this.data['thickness'] = value; }

  get color(): Color { return this.data['color']; }
  set color(value: Color) { this.data['color'] = value; }

  public buildEffect() {
    if (this.element.shapeOutlineElement) {
      this.element.shapeOutlineElement.remove();
      this.element.shapeOutlineElement = null;
    }
    if (this.enabled) {
      const newWidth = this.element.shapeSvgElement.width() - this.thickness / 5.0;
      const newHeight = this.element.shapeSvgElement.height() - this.thickness / 5.0;

      this.element.shapeOutlineElement = this.element.shapeSvgElement.clone()
        .removeClass('selected')
        .removeClass('selectable')
        .size(newWidth, newHeight)
        .cx(this.element.shapeSvgElement.cx())
        .cy(this.element.shapeSvgElement.cy())
        .fill(this.element.fill.rgb)
      ;
      this.element.shapeSvgElement.fill(this.color.rgb);
    }
    return null;
  }

  boundingBox(): EffectBox {
    return null;
  }
  get className(): string {
    return 'ShapeOutline';
  }
}
