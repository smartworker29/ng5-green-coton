import { Area } from './designs/area';
import { ColorsService } from './colors/colors.service';
import { DesignsService } from './designs/designs.service';

// load each subclass of Element so we can instantiate them in loadFrom();
import { ClipartElement } from './elements/clipart/clipart-element';
import { ImageUploadElement } from './elements/image-upload/image-upload-element';
import { NamesAndNumbersElement } from './elements/names-and-numbers/names-and-numbers-element';
import { ShapeElement } from './elements/shape/shape-element';
import { TextElement } from './elements/text/text-element';

export class ElementFactory {
  static fromJson(json: object, area: Area, colorsService: ColorsService): Element {
    const elementType = json['type'];
    let element = null;

    switch (elementType) {
      case 'ShapeElement':
        element = ShapeElement.newFromJson(json, area);
        break;

      case 'TextElement':
        element = TextElement.newFromJson(json, area);
        break;

      case 'ClipartElement':
        element = ClipartElement.newFromJson(json, area, colorsService, null);
        break;

      case 'ImageUploadElement':
        element = ImageUploadElement.newFromJson(json, area, null);
        break;

      case 'NamesAndNumbersElement':
        element = NamesAndNumbersElement.newFromJson(json, area);
        break;
    }

    return element;
  }
}
