import { Input, OnChanges, OnInit, OnDestroy } from '@angular/core';
import { Effect } from './effect';
import { Element } from '../element';
import { ElementComponent } from './element.component';

export class EffectComponent implements OnChanges, OnInit, OnDestroy {
  @Input() element: Element;
  protected effect: Effect;
  elementComponent: ElementComponent;

  constructor(elementComponent: ElementComponent) {
    this.elementComponent = elementComponent;
    this.element = this.elementComponent.currentElement;
  }

  ngOnInit() {
    this.additionalOnInit();
  }

  protected additionalOnInit() {}

  protected newEffect(): Effect {
    throw(new Error('Must be implemented by sub-class'));
  }

  protected effectClass(): string {
    throw(new Error('Must be implemented by sub-class'));
  }

  // NOTE: called when the element changes, not the effect properties
  ngOnChanges(changes: any) {
    this.effect = this.element.getEffect(this.effectClass());
    if (!this.effect) {
      this.effect = this.newEffect();
      this.element = this.elementComponent.currentElement;
      this.effect.element = this.element;
    }
  }

  public onEffectChanges(property: string, value: any) {
    this.effect[property] = value;
    this.element.addEffect(this.effect);
    this.element.render().subscribe();
  }

  ngOnDestroy() {
    this.additionalOnDestroy();
  }

  protected additionalOnDestroy() {}
}

export class ChangeData {
  property: string;
  value: any;

  constructor(property: string, value: any) {
    this.property = property;
    this.value = value;
  }
}
