import { Category } from './category';
import { Color } from './color';
import { Side } from './side';
import { Variant } from './variant';
import * as _ from 'lodash';

export class Product {
  public id: string;
  public name: string;
  public imageUrl: string;
  public isPromo = false;
  public sort = 0;
  private categories: Category[];
  public sides: Side[] = [];
  public variants: Variant[] = [];
  private _color: Color;
  public minimum = 0;

  static newFromJson(json: object): Product {
    const product = new Product();
    product.fromJson(json);
    return product;
  }

  get color() { return this._color ? this._color : this.availableColors()[0]; }
  set color(value: Color) { this._color = value; }

  availableColors(): Color[] {
    // NOTE: getting colors from variants, only including those with a swatch, and distinct by id
    return _.uniqBy(this.variants.map((v) => v.color).filter((c) => c.swatch()), 'id');
  }

  availableColorValues(): string[] {
    return this.availableColors()
                .map((c) => c.swatch())
                .filter((s) => !!s);
  }

  findColorByHex(hex: string): Color {
    return this.availableColors().find((c) => c.swatch() === hex);
  }

  availableSizes(): string[] {
    const sizes = _.map(this.variants, function(v) {
      if (v.size) {
        return v.size;
      }
    });
    return _.uniq(sizes);
  }

  get maskImageUrl(): string { return this.sides[0].masks[0].imageUrl; }

  toJson(): object {
    return {
      id: this.id,
      name: this.name,
      categories: this.categories,
      sides: this.sides,
      variants: this.variants,
      minimum: this.minimum
    };
  }

  fromJson(json: Object): void {
    this.id = json['id'];
    this.name = json['name'];
    this.isPromo = json['isPromo'];
    this.imageUrl = json['imageUrl'];
    this.categories = json['categories'];
    this.sides = json['sides'];
    this.variants = json['variants'].map((v) => Variant.newFromJson(v));
    this.minimum = json['minimum'];
  }
}
