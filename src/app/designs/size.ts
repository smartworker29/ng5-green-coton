export class Size {
  public size: string;
  public quantity: number;

  static newFromJson(json: object): Size {
    const size = new Size(null, null);
    size.fromJson(json);
    return size;
  }

  constructor(size: string, quantity = 0) {
    this.size = size;
    this.quantity = quantity;
  }

  youth(): boolean {
    return this.size.indexOf('Y') !== -1;
  }

  toJson(): object {
    return {
      size: this.size,
      quantity: this.quantity,
    };
  }

  fromJson(json: object) {
    this.size = json['size'];
    this.quantity = json['quantity'];
  }
}
