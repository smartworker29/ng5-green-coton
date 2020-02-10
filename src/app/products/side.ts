import { Area } from './area';
import { Mask } from './mask';

export class Side {
  public name: string;
  public imageUrl: string;
  public pixelsPerInch = 0;
  public masks: Mask[] = [];
  public areas: Area[] = [];

  static newFromJson(json: object): Side {
    const side = new Side();
    side.fromJson(json);
    return side;
  }

  fromJson(json: Object): void {
    this.name = json['name'];
    this.imageUrl = json['imageUrl'];
    this.pixelsPerInch = json['pixelsPerInch'];
    this.masks = json['masks'];
    this.areas = json['areas'];
  }
}
