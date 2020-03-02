import { BottomSlope } from './bottom-slope';
import { Bulge } from './bulge';
import { Hill } from './hill';
import { Megaphone } from './megaphone';
import { Plain } from './plain';
import { Railroad } from './railroad';
import { Starwars } from './starwars';
import { TopSlope } from './top-slope';
import { Arch } from './arch';

import { TextShapeType } from './text-shape-type';

export class TextShapeFactory {

  public static shapeNames(): string[] {
    return ['hill', 'megaphone', 'railroad', 'bulge', 'starwars', 'topslope', 'bottomslope', 'arch'];
  }

  public static build(name: string): TextShapeType {
    switch (name) {
      case 'bottomslope':
        return new BottomSlope();
      case 'bulge':
        return new Bulge();
      case 'hill':
        return new Hill();
      case 'megaphone':
        return new Megaphone();
      case 'railroad':
        return new Railroad();
      case 'starwars':
        return new Starwars();
      case 'topslope':
        return new TopSlope();
      case 'arch':
        return new Arch();
      default:
        return new Plain();
    }
  }
}
