import { Effect } from './effect';
import { Element } from '../element';

import { DropShadow } from './text/effects/drop-shadow';
import { TextShape } from './text/effects/text-shape';
import { Outline } from './text/effects/outline';
import { OutlineTwo } from './text/effects/outline-two';
import { ShapeOutline } from './shape/effects/shape-outline';
import { Transform as ClipartTransform } from './clipart/effects/transform';
import { Transform as ImageTransform } from './image-upload/effects/transform';
import { Transform as ShapeTransform } from './shape/effects/transform';
import { Transform as TextTransform } from './shape/effects/transform';

export class EffectFactory {
  static fromJson(json: object, element: Element): Effect {
    const effectType: string = json['type'];
    let effect: Effect = null;

    switch (effectType) {
      case 'DropShadow':
        effect = DropShadow.newFromJson(json, element);
        break;

      case 'TextShape':
        effect = TextShape.newFromJson(json, element);
        break;

      case 'Outline':
        effect = Outline.newFromJson(json, element);
        break;

      case 'OutlineTwo':
        effect = OutlineTwo.newFromJson(json, element);
        break;

      case 'ShapeOutline':
        effect = ShapeOutline.newFromJson(json, element);
        break;

      case 'Transform':
        switch (element.className) {
          case 'ClipartElement':
              effect = ClipartTransform.newFromJson(json, element);
              break;
          case 'ImageUploadElement':
              effect = ImageTransform.newFromJson(json, element);
              break;
          case 'ShapeElement':
              effect = ShapeTransform.newFromJson(json, element);
              break;
          case 'TextElement':
            effect = TextTransform.newFromJson(json, element);
            break;
        }
        break;

      default:
        console.log('%o not handled by EffectFactory', effectType);

    }

    return effect;
  }
}
