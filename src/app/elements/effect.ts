export class Effect {
  public element: any;

  protected data: any = { enabled: false, weight: 50 };

  get enabled() { return this.data['enabled']; }
  set enabled(value) { this.data['enabled'] = value; }

  get weight() { return this.data['weight']; }
  set weight(value) { this.data['weight'] = value; }

  buildEffect() {
    throw(new Error('Must be implemented by subclass'));
  }

  boundingBox(): EffectBox {
    return null;
  }

  toJson(): object {
    return {
      type: this.className,
      data: this.data,
    };
  }

  get className(): string {
    return 'Effect';
  }

  fromJson(json: object) {
    this.data = json['data'];
  }
}

export class EffectBox {
  top: number;
  left: number;
  bottom: number;
  right: number;

  constructor() {
    this.top = 0;
    this.right = 0;
    this.bottom = 0;
    this.left = 0;
  }
}
