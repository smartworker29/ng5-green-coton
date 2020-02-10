import { Color } from '../../colors/color';

export class Layer {
  public id: string;
  public description: string;
  public elementReference: any;
  public colors: Color[];
  public weight = 99;

  public elementType(): string {
    return this.elementReference.className;
  }

  get icon(): string {
    return this.elementReference.icon;
  }
}
