import { Color } from '../../../colors/color';
import { Effect, EffectBox } from '../../effect';
import { Element } from '../../../element';
import * as SVG from 'svg.js';

export class DropShadow extends Effect {

  static newFromJson(json: object, element: Element): DropShadow {
    const effect = new DropShadow();
    effect.element = element;
    effect.fromJson(json);
    effect.color = Color.fromJson(effect.color);
    return effect;
  }

  constructor(color?: Color) {
    super();
    this.data['weight'] = 15;
    this.xOffset = 5;
    this.yOffset = 5;
    this.data['color'] = color;
  }

  get color(): Color { return this.data['color']; }
  set color(color: Color) { this.data['color'] = color; }

  get xOffset(): number { return this.data['xOffset']; }
  set xOffset(value: number) { this.data['xOffset'] = value; }

  get yOffset(): number { return this.data['yOffset']; }
  set yOffset(value: number) { this.data['yOffset'] = value; }

  public removeEffect() {
    if (this.element.dropShadowPaths && this.element.dropShadowPaths.node && this.element.dropShadowPaths.node.parentNode) {
      this.element.dropShadowPaths.remove();
    }
  }

  public buildEffect() {
    this.removeEffect();

    if (this.enabled) {
      const fill = this.color.rgb;

      this.element.dropShadowPaths = this.element.textPaths.clone(this.element.textPathsContainer);
      this.element.dropShadowPaths
        .x(this.xOffset)
        .y(this.yOffset)
        .stroke(fill)
        .fill(fill)
        .addClass('dropShadowPaths')
      ;
      return null;
    }
  }

  boundingBox(): EffectBox {
    if (this.enabled) {
      const effectBox = new EffectBox();
      effectBox.top = -this.yOffset;
      effectBox.right = this.xOffset;
      effectBox.bottom = -this.yOffset;
      effectBox.left = -this.xOffset;
      return effectBox;
    }
    return null;
  }

  get className(): string {
    return 'DropShadow';
  }
}
