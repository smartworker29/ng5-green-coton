import { Area } from './designs/area';
import { Color } from './colors/color';
import { DesignsEvent } from './designs/designs-event';
import { Effect, EffectBox } from './elements/effect';
import { EffectFactory } from './elements/effect-factory';
import { ElementComponent } from './elements/element.component';
import { Font } from './ui/font.interfaces';
import { Layer } from './elements/layers/layer';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import * as SVG from 'svg.js';
const SVGBoundings = require('svg-boundings');

export class Element {
  protected data: any = {};
  protected _effects: any = {};
  public svgElement: any;
  area: Area;
  protected resizing = false;

  constructor(area: Area) {
    this.area = area;
    this.rotationDegrees = 0;
    this.flipAxis = '';
  }

  get id(): string { return this.data['id']; }
  set id(value: string) { this.data['id'] = value; }

  get x(): number { return this.data['x']; }
  set x(value: number) { this.data['x'] = value; }

  get y(): number { return this.data['y']; }
  set y(value: number) { this.data['y'] = value; }

  get width(): number { return this.data['width']; }
  set width(value: number) { this.data['width'] = value; }

  get height(): number { return this.data['height']; }
  set height(value: number) { this.data['height'] = value; }

  get rotationDegrees(): number { return this.data['rotationDegrees']; }
  set rotationDegrees(value: number) { this.data['rotationDegrees'] = value; }

  get flipAxis(): string { return this.data['flipAxis']; }
  set flipAxis(value: string) { this.data['flipAxis'] = value; }

  public center() {
    this.svgElement.cx(this.area.coords.w / 2);
    this.x = this.svgElement.x();
    if (this.selectableElement.hasClass('selected')) {
      this.select();
    }
  }

  public resetRotation() {
    this.rotate(0);
    this.updateDimensions();
  }

  public duplicate(): Element {
    const newElement = _.cloneDeep(this);
    newElement.id = null;
    newElement.svgElement = null;
    newElement.area = this.area;
    newElement.y += 50;
    return newElement;
  }

  public render(): Observable<void> {
    throw(new Error('render() must be implemented by sub-class'));
  }

  public transform(object: any, reset = false) {
    this.svgElement.transform(object, reset);
  }

  public bbox() {
    return this.svgElement.bbox();
  }

  public rbox(element?: any) {
    if (!element) {
      element = this.area.maxImprintAreaElement;
    }
    return this.svgElement.rbox(element);
  }

  public inside(point) {
    const rbox = this.rbox(this.area.maxImprintAreaElement);
    return (
      point['x'] >= rbox.x
      && point['x'] <= rbox.x2
      && point['y'] >= rbox.y
      && point['y'] <= rbox.y2
    );
  }

  protected addDraggableBehavior() {
    if (!this.svgElement) {
      return;
    }

    const element = this;

    this.svgElement.draggable(function(x, y) {

      const maxImprintAreaElement = element.area.maxImprintAreaElement;
      const imprintAreaViewBox = maxImprintAreaElement.viewbox();

      const bbox = element.wrapperBox();

      let newElementX = x;
      let newElementY = y;

      const minElementX = 0;
      const maxElementX = imprintAreaViewBox.width - bbox.width;

      const minElementY = 0;
      const maxElementY = imprintAreaViewBox.height - bbox.height;

      let diffElementX = 0;
      let diffElementY = 0;

      // make sure element stays within maxImprintArea
      if (newElementX < minElementX) {
        diffElementX = newElementX - minElementX;
        newElementX = minElementX;
      }

      if (newElementX > maxElementX) {
        diffElementX = newElementX - maxElementX;
        newElementX = maxElementX;
      }

      if (newElementY < minElementY) {
        diffElementY = newElementY - minElementY;
        newElementY = minElementY;
      }

      if (newElementY > maxElementY) {
        diffElementY = newElementY - maxElementY;
        newElementY = maxElementY;
      }

      if (diffElementX || diffElementY) {
        element.area.toggleMaxImprintAreaVisibility(true);
      }

      // Should we move the maxImprintArea?
      if (element.area.maxImprintMovementAllowed) {
        if (diffElementY > 0) {
          // we're moving the element down past its max allowed by the imprintArea
          // so let's move the maxImprintArea down by diffElementY (or by however much we can)
          if (diffElementY + maxImprintAreaElement.y() + maxImprintAreaElement.height() > element.area.height()) {
            diffElementY = element.area.height() - maxImprintAreaElement.y() - maxImprintAreaElement.height();
          }
          maxImprintAreaElement.y(maxImprintAreaElement.y() + diffElementY);

        } else if (diffElementY < 0) {
          // we're moving the element up past its max allowed by the imprintArea
          // so let's move the maxImprintArea down by diffElementY (or by however much we can)
          if (diffElementY + maxImprintAreaElement.y() < 0) {
            diffElementY = 0 - maxImprintAreaElement.y();
          }
          maxImprintAreaElement.y(maxImprintAreaElement.y() + diffElementY);
        }

        if (diffElementX > 0) {
          // we're moving the element right past its max allowed by the imprintArea
          // so let's move the maxImprintArea right by diffElementX (or by however much we can)
          if (diffElementX + maxImprintAreaElement.x() + maxImprintAreaElement.width() > element.area.width()) {
            diffElementX = element.area.width() - maxImprintAreaElement.x() - maxImprintAreaElement.width();
          }
          maxImprintAreaElement.x(maxImprintAreaElement.x() + diffElementX);

        } else if (diffElementX < 0) {
          // we're moving the element left past its max allowed by the imprintArea
          // so let's move the maxImprintArea left by diffElementY (or by however much we can)
          if (diffElementX + maxImprintAreaElement.x() < 0) {
            diffElementX = 0 - maxImprintAreaElement.x();
          }
          maxImprintAreaElement.x(maxImprintAreaElement.x() + diffElementX);
        }
      }

      return {
        x: newElementX,
        y: newElementY,
      };
    });

    let dragging = false;
    const thisElement = this;
    this.svgElement.node.addEventListener('mouseup',   function() { dragging = false; });

    this.svgElement.node.addEventListener('dragstart', function() {
      dragging = true;
      thisElement.area.design.unselectAllElements();
    });

    this.svgElement.node.addEventListener('touchmove', function(e) {
      dragging = true;
      thisElement.area.design.unselectAllElements();
    });

    this.svgElement.node.addEventListener('dragend', function(e) {
      thisElement.onDragEnd(thisElement, e);
      thisElement.area.toggleMaxImprintAreaVisibility(false);
    });
  }

  protected onDragEnd(element: Element, e: Event) {
    const target = e.target as SVGElement;
    element.x = parseInt(target.getAttribute('x'), 10);
    element.y = parseInt(target.getAttribute('y'), 10);
    this.area.design.updateElement(element.area, element, false);
    (this.selectableElement as any).selectify(true, this.selectableOptions);
  }

  protected addClickableBehavior() {
    if (!this.selectableElement) {
      return;
    }

    let dragging = false;
    const node = this.selectableElement.node;
    const thisElement = this;
    ['mouseup', 'touchend'].forEach((evt) => {
      node.addEventListener(evt, function(e) { dragging = false; });
    });

    ['mousemove', 'touchmove'].forEach((evt) => {
      node.addEventListener(evt, function(e) { dragging = true; });
    });

    ['click', 'touchstart'].forEach((evt) => {
      node.addEventListener(evt, function(e) { thisElement.clickHandler(node, dragging, e); });
    });
  }

  public clickHandler(node: any, dragging: boolean, e: Event) {
    node.instance.selectify(this.selectableOptions);
  }

  protected addSelectableBehavior() {
    if (!this.selectableElement) {
      return;
    }

    const self = this;

    this.selectableElement.on('delete', function(e) {
      if (confirm('Are you sure you want to remove this?')) {
        self.area.design.removeElement(self.area, self);
      }
    });

    this.selectableElement.on('click', function(e) {
      self.area.design.broadcastEvent(new DesignsEvent('SELECT_ELEMENT', self));
      (self.selectableElement as any).selectify(true, self.selectableOptions);
      e.stopPropagation();
    });

    this.selectableElement.on('edit', function(e) {
      self.area.design.broadcastEvent(new DesignsEvent('EDIT_ELEMENT', self));
    });

    this.selectableElement.addClass('selectable');

    (this.selectableElement as any).selectify(false, self.selectableOptions);
  }

  get selectableElement(): SVG.Element {
    return this.svgElement;
  }

  get selectableOptions(): any {
    return {
      designElement: this,
    };
  }

  protected allowResize(): boolean {
    return true;
  }

  protected allowRotate(): boolean {
    return true;
  }

  protected addResizableBehavior() {
    if (!this.resizableElement || !this.allowResize()) {
      return;
    }

    (this.resizableElement as any).resize(this.resizableOptions());

    const thisElement = this;
    this.resizableElement.node.addEventListener('resizestart', function(e) {
      thisElement.resizing = true;
    });
    this.resizableElement.node.addEventListener('resizedone', function(e) {
      thisElement.resizeDoneHandler(e);
      thisElement.resizing = false;
      thisElement.select();
    });
  }

  get resizableElement(): SVG.Element {
    return this.svgElement;
  }

  protected resizableOptions(): object {
    return {
      snapToAngle: 1,
      designElement: this,
      preserveAspectRatio: true,
      getRotation: null,
      renderDuringResize: true,
    };
  }

  protected resizeDoneHandler(e: Event) {}

  resize(width: number, height: number, keepCentered = true) {
    const oldBox = this.wrapperBox();

    this.resizableElement
      .size(width, height)
      .center(width / 2, height / 2)
    ;

    if (keepCentered) {
      const subElementBox = this.subElementBox();
      this.x = oldBox.cx - (subElementBox.width / 2);
      this.y = oldBox.cy - (subElementBox.height / 2);
    }

    this.setWrapperDimensions();
  }

  scale(scaleW: number, scaleH: number) {
    const oldBox = this.wrapperBox();

    this.resizableElement
      .width(this.resizableElement.width() * scaleW)
      .height(this.resizableElement.height() *  scaleH)
    ;

    // Keep it centered
    const subElementBox = this.subElementBox();
    this.x = oldBox.cx - (subElementBox.width / 2);
    this.y = oldBox.cy - (subElementBox.height / 2);

    this.setWrapperDimensions();
  }

  rotate(degrees: number) {
    const oldBox = this.wrapperBox();

    this.rotationDegrees = degrees % 360;
    if(this.rotationDegrees < 0)
      this.rotationDegrees += 360;

    this.resizableElement.attr('transform', null);
    this.flip();

    this.resizableElement.transform({ rotation: this.rotationDegrees }, true);

    const subElementBox = this.subElementBox();
    this.x = oldBox.cx - (subElementBox.width / 2);
    this.y = oldBox.cy - (subElementBox.height / 2);

    this.setWrapperDimensions();
  }

  flip() {
    if (this.flipAxis) {
      this.resizableElement.flip(this.flipAxis);
    }
  }

  public addEffect(effect: Effect) {
    this._effects[effect.className] = effect;
  }

  public getEffect(effectClassName: string): Effect {
    return this._effects[effectClassName];
  }

  public effects(): any[] {
    let effects = [];
    Object.keys(this._effects).forEach(effectName => {
      effects.push(this._effects[effectName]);
    });

    effects = effects.sort(function(a, b) {
      if (a.weight < b.weight) { return -1; }
      if (a.weight > b.weight) { return 1; }
      return 0;
    });
    return effects;
  }

  public enabledEffects(): any[] {
    return this.effects().filter(e => e.enabled);
  }

  protected rebuildEnabledEffects() {
    this.effects().forEach((effect) => effect.buildEffect());
    this.setWrapperDimensions();
  }

  setWrapperDimensions(): void {
    const box = this.wrapperBox();
    this.width = box.width;
    this.height = box.height;
    this.x = box.x;
    this.y = box.y;
  }

  wrapperBox(): SVG.Box {
    const wrapperBox = new SVG.BBox();
    const subElementBox = this.subElementBox();

    wrapperBox.x = this.x;
    wrapperBox.y = this.y;
    wrapperBox.w = subElementBox.width;
    wrapperBox.h = subElementBox.height;

    wrapperBox.cx = wrapperBox.w / 2 + wrapperBox.x;
    wrapperBox.cy = wrapperBox.h / 2 + wrapperBox.y;

    wrapperBox.width = wrapperBox.w;
    wrapperBox.height = wrapperBox.h;

    return wrapperBox;
  }

  // Returns accurate rbox in context of wrapper element
  subElementBox(): SVG.Box {
    const subElementBox = new SVG.BBox();
    const box = this.accurateBoundingBox();

    subElementBox.x = box.x;
    subElementBox.y = box.y;
    subElementBox.w = box.width;
    subElementBox.h = box.height;

    subElementBox.width = subElementBox.w;
    subElementBox.height = subElementBox.h;
    subElementBox.cx = box.width / 2;
    subElementBox.cy = box.height / 2;
    return subElementBox;
  }

  accurateBoundingBox(): SVG.Box {
    throw(new Error('accurateBoundingBox() must be implemented by subclass'));
  }

  protected defaultPosition() {
    return [
      this.area.coords.w / 2,
      this.area.coords.h / 6,
    ];
  }

  public remove() {
    this.unselect();
    this.svgElement.remove();
  }

  public select() {
    if (this.selectableElement) {
      (this.selectableElement as any).selectify(true, this.selectableOptions);
    }
  }

  protected unselect() {
    if (this.selectableElement) {
      (this.selectableElement as any).selectify(false, this.selectableOptions);
    }
  }

  public colors(): Color[] {
    throw(new Error('colors() must be implemented by subclass'));
  }

  public fonts(): Font[] {
    return [];
  }

  protected layerDescription(): string {
    return 'Element';
  }

  get className(): string {
    return 'Element';
  }

  public toLayer(): Layer {
    const layer = new Layer();
    layer.id = this.id;
    layer.description = this.layerDescription();
    layer.elementReference = this;
    layer.colors = this.colors();
    layer.weight = 99;
    return layer;
  }

  get icon(): string {
    // subclasses should override this
    return '<i class="fa fa-question"></i>';
  }

  toJson(): object {
    return {
      type: this.className,
      id: this.id,
      data: this.data,
      effects: this.enabledEffects().map((e) => e.toJson()),
    };
  }

  fromJson(json: object): void {
    this.id = json['id'];
    this.data = json['data'];
    json['effects'].map((e) => {
      this.addEffect(EffectFactory.fromJson(e, this));
    });
  }

  updateDimensions(rateX = 1, rateY = 1) {
    const originX = this.x
    const originY = this.y

    this.scaleToFit(rateX, rateY);
    this.moveToFit(originX, originY, rateX, rateY);
    if (this.svgElement) {
      this.render().subscribe();
    }
  }

  protected scaleToFit(rate = 1, rateY = 1) {
    const rectRatio = this.width / this.height;
    const boundsRatio = this.area.maxImprintAreaElementW / this.area.maxImprintAreaElementH;

    let newWidth = 0;
    let newHeight = 0;

    if (rectRatio > boundsRatio) {
      if (this.width > this.area.maxImprintAreaElementW) {
        if(rate === 1) {
          newWidth = this.area.maxImprintAreaElementW * rate;
          newHeight = this.height * (this.area.maxImprintAreaElementW / this.width) * rate;
        } else {
          newWidth = this.width * rate;
          newHeight = this.height * rate;
        }
        this.resize(newWidth, newHeight);
      } else {
        newWidth = this.width * rate;
        newHeight = this.height * rate;
        if(rate != 1) {
          this.resize(newWidth, newHeight)
        }
      }
    } else {
      if (this.height > this.area.maxImprintAreaElementH) {
        if(rate === 1) {
          newWidth = this.width * ( this.area.maxImprintAreaElementH / this.height) * rate;
          newHeight = this.area.maxImprintAreaElementH * rate;
        } else {
          newWidth = this.width * rate;
          newHeight = this.height * rate;
        }
        this.resize(newWidth, newHeight);
      } else {
        newWidth = this.width * rate;
        newHeight = this.height * rate;
        if(rate != 1) {
          this.resize(newWidth, newHeight)
        }
      }
    }
  }

  protected moveToFit(originX = 0, originY = 0, rateX = 1, rateY = 1) {
    if(rateX != 1) {
      this.x = originX * rateX;
      const originH = this.height / rateX;
      this.y = originY < this.area.maxImprintAreaElementH / rateY / 2 ? originY * rateY : (originY+originH) * rateY - this.height;
    }
    if (this.y <= 0) {
      this.y = 0;
    } else {
      if ((this.y + this.height) > this.area.maxImprintAreaElementH) {
        this.y = this.area.maxImprintAreaElementH - this.height;
      }
    }

    if (this.x <= 0) {
      this.x = 0;
    } else {
      if ((this.x + this.width) > this.area.maxImprintAreaElementW) {
        this.x = this.area.maxImprintAreaElementW - this.width;
      }
    }
  }

  protected get subElement(): any {
    throw(new Error('subElement() must be implemented by sub-class'));
  }
};

export class AccurateBoundingBox {
  left = 0;
  right = 0;
  top = 0;
  bottom = 0;
  width = 0;
  height = 0;
}
