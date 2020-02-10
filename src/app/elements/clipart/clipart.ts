import { Color } from '../../colors/color';

export class Clipart {
  externalId: string;
  title: string;
  parentId: string;
  imageUrl: string;
  sort = 0;
  svgUrl: string;
  layers: Layer[] = [];
};

export class Layer {
  index: number;
  defaultColor: Color;
  name: string;
  url: string;
  svg: string;
  fill: Color;
}

