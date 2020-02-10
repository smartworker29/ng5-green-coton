import { Effect } from '../../effect';
import { Element } from '../../../element';

export class Transform extends Effect {

  static newFromJson(json: object, element: Element): Transform {
    const effect = new Transform();
    effect.element = element;
    effect.fromJson(json);
    return effect;
  }

  constructor() {
    super();
    this.data['enabled'] = true;
    this.data['weight'] = 5;
  }

  buildEffect() {
    // NOTE: returning null because this effect doesn't use SVG filters
    return null;
  }

  get className(): string {
    return 'Transform';
  }
}
