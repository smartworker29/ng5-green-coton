import { Color as DesignColor } from '../colors/color';

export class Color {
  sort = 0;
  name: string;
  id: string;
  sizes: string[] = [];
  display: Array<{type: string, value: string}> = [];
  images: Array<{front: string, back: string, left: string, right: string}> = [];
  layers: number;
  maskRGBs: MaskRGB[] = [];

  static newFromJson(json: object): Color {
    const color = new Color();
    color.fromJson(json);
    return color;
  }

  swatch(index = 0) {
    if (!this.display.length || index > this.display.length - 1) {
      return null;
    }

    // TODO: handle a multi-color or image-based swatch someday
    const color = this.display[index];
    if (color.type === 'hex') {
      return color.value;
    } else if (color.type === 'image') {
      return '#000000';
    }
  }

  toRgb(index = 0) {
    const color = new DesignColor();
    color.rgb = this.swatch();
    color.display = this.display;
    return color.toRgb(index);
  }

  fromJson(json: object) {
    this.sort = json['sort'];
    this.name = json['name'];
    this.id = json['id'];
    this.sizes = json['sizes'];
    this.display = json['display'];
    this.layers = this.display.length;
  }

  toJson(): object {
    return {
      sort: this.sort,
      name: this.name,
      id: this.id,
      sizes: this.sizes,
      display: this.display,
    };
  }
}

export interface MaskRGB {
  index: number;
  rgb: string;
}
