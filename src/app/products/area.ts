export class Area {
  public x = 0;
  public y = 0;
  public h = 0;
  public w = 0;

  constructor(options?: Object) {
    if (options) {
      for (const key in options) {
        if (key) {
          this[key] = options[key];
        }
      }
    }
  }

  coords(): any {
    return {
      x: this.x,
      y: this.y,
      h: this.h,
      w: this.w,
    };
  }
}
