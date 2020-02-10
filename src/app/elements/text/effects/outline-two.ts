import { Color } from '../../../colors/color';
import { Effect, EffectBox } from '../../effect';
import { Element } from '../../../element';
import * as SVG from 'svg.js';

export class OutlineTwo extends Effect {

  protected outlinePaths: SVG.Nested;

  static newFromJson(json: object, element: Element): OutlineTwo {
    const effect = new OutlineTwo();
    effect.element = element;
    effect.fromJson(json);
    effect.color = Color.fromJson(effect.color);
    return effect;
  }

  constructor(color?: Color) {
    super();
    this.data['weight'] = 19;
    this.data['thickness'] = 30;
    this.data['color'] = color;
  }

  get thickness(): number { return this.data['thickness']; }
  set thickness(value: number) { this.data['thickness'] = value; }

  get color(): Color { return this.data['color']; }
  set color(value: Color) { this.data['color'] = value; }

  public removeEffect() {
    if (this.outlinePaths && this.outlinePaths.node && this.outlinePaths.node.parentNode) {
      this.outlinePaths.remove();
    }
  }

  public buildEffect() {

    this.removeEffect();

    if (this.enabled) {
      this.outlinePaths = this.element.textPaths.clone(this.element.textPathsContainer);
      const strokeWidth = (this.element.first_outline_width / 5.0) + (this.thickness / 5.0);
      this.outlinePaths
        .attr({'stroke-width': strokeWidth })
        .stroke(this.color.rgb)
        .fill(this.color.rgb)
        .addClass('textOutlineTwoPaths')
      ;
      return null;
    }
  }

  boundingBox(): EffectBox {
    if (this.enabled) {
      // Unfortunately, we can't measure stroke-width reliably with bbox/rbox
      // So we have to declare what it is (and hopefully be right)
      const effectBox = new EffectBox();
      const strokeWidth = (this.element.first_outline_width / 5.0) + (this.thickness / 5.0);
      effectBox.top = strokeWidth / 2.0;
      effectBox.right = strokeWidth / 2.0;
      effectBox.bottom = strokeWidth / 2.0;
      effectBox.left = strokeWidth / 2.0;

      return effectBox;
    }
    return null;
  }

  get className(): string {
    return 'OutlineTwo';
  }
}

