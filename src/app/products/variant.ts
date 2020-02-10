import { Color } from './color';

export class Variant {
  color: Color;
  size: string;

  static newFromJson(json: object): Variant {
    const variant = new Variant();
    variant.color = Color.newFromJson(json['color']);
    variant.size = json['size'];
    return variant;
  }

  toJson(): object {
    return {
      color: this.color.toJson(),
      size: this.size,
    };
  }
}
