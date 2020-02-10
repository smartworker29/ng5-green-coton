export class Color {
  id: string;
  name: string;
  rgb: string;
  display: Array<{type: string, value: string}> = [];
  images: Array<{front: string, back: string, left: string, right: string}> = [];

  static garmentColor(): Color {
    const color = new Color();
    color.id = 'GARMENT_COLOR';
    color.name = 'Garment Color';
    color.rgb = null;
    return color;
  }

  static fromJson(json: object): Color {
    const color = new Color();
    color.id = json['id'];
    color.name = json['name'];
    color.rgb = json['rgb'];
    color.display = json['display'] || [];
    color.images = json['images'] || [];
    return color;
  }

  toRgb(index = 0) {
    let r = 255;
    let g = 255;
    let b = 255;

    const rgb = this.display.length ? this.display[index].value : this.rgb;

    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(rgb)) {
      let c = rgb.substring(1).split('');
      if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      r = parseInt(c.slice(0, 2).join(''), 16);
      g = parseInt(c.slice(2, 4).join(''), 16);
      b = parseInt(c.slice(4, 6).join(''), 16);
    }
    return [r, g, b];
  }

  toMatrix() {
    let r = 255;
    let g = 255;
    let b = 255;

    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(this.rgb)) {
      let c = this.rgb.substring(1).split('');
      if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }

      r = parseInt(c.slice(0, 2).join(''), 16);
      g = parseInt(c.slice(2, 4).join(''), 16);
      b = parseInt(c.slice(4, 6).join(''), 16);
    }
    return [
      0, 0, 0, 0, r / 255.0,
      0, 0, 0, 0, g / 255.0,
      0, 0, 0, 0, b / 255.0,
      0, 0, 0, 1, 0,
    ];
  }
}
