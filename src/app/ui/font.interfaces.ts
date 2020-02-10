export interface FontInterface {
  category: string;
  family: string;
  files?: any;
  size: string;
  style: string;
  styles: string[];
}

export interface GoogleFontInterface {
  category: string;
  family: string;
  files: Object[];
  kind: string;
  variants: string[];
}

export interface FontPickerConfigInterface {
  apiKey?: string;
}

export class FontPickerConfig implements FontPickerConfigInterface {
  apiKey: string = null;

  constructor(config: FontPickerConfigInterface = {}) {
    this.assign(config);
  }

  public assign(config: FontPickerConfigInterface = {}) {
    for (const key in config) {
      if (key) {
        this[key] = config[key];
      }
    }
  }
}

export class Font {
  public category: string;
  public family: string;
  public files: any;
  public size: string;
  public style: string;
  public styles: string[];

  static fromJson(json: object): Font {
    return new Font(json as FontInterface);
  }

  constructor(props: FontInterface) {
    this.category = props.category || null;
    this.family = props.family || 'monospace';
    this.styles = props.styles || ['regular'];
    this.style = props.style || 'regular';
    this.files = props.files || null;
    this.size = props.size || null;
  }

  public getStyles(): any {
    return {
      'font-size': this.size || '16px',
      'font-family': this.family || 'monospace',
      'font-style': this.style.includes('italic') ? 'italic' : 'normal',
      'font-weight': isNaN(Number(this.style.slice(0, 3))) ? 'normal' : this.style.slice(0, 3)
    };
  }

  public get url(): string {
    return this.files['regular'].replace(/^https?:/i, '');
  }
}

export class GoogleFonts {
  kind: string;
  items: Array<any>;
}
