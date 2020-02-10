export class Mask {
  index: number;
  imageUrl: string;
  previewImageUrl: string;

  static newFromJson(json: object): Mask {
    const mask = new Mask();
    mask.fromJson(json);
    return mask;
  }

  fromJson(json: object) {
    this.index = json['index'];
    this.imageUrl = json['imageUrl'];
    this.previewImageUrl = json['previewImageUrl'];
  }

  toJson(): object {
    return {
      index: this.index,
      imageUrl: this.imageUrl,
      previewImageUrl: this.previewImageUrl,
    };
  }
}
