export class NameAndNumber {
  public size: string;
  public name: string;
  public number: string;

  static newFromJson(json: object): NameAndNumber {
    const nameAndNumber = new NameAndNumber(null);
    nameAndNumber.fromJson(json);
    return nameAndNumber;
  }

  constructor(size: string, name = '', number = '') {
    this.size = size;
    this.name = name;
    this.number = number;
  }

  toJson(): object {
    return {
      size: this.size,
      name: this.name,
      number: this.number,
    };
  }

  fromJson(json: object): void {
    this.size = json['size'];
    this.name = json['name'];
    this.number = json['number'];
  }
}
