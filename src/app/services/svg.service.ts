import { Injectable } from '@angular/core';
import * as SVG from 'svg.js';
require('../../lib/svg.draggable.js');
require('../../../node_modules/svg.filter.js/dist/svg.filter.js');
require('../../lib/svg.select.js');
require('../../lib/svg.resize.js');

@Injectable()
export class SvgService {
  private _draw: any;

  constructor() {
    // customize element selection
    const thisService = this;

    SVG.extend(SVG.Element, {
      selectify: function(value, options) {
        thisService.draw().getSelected().removeClass('selected').selectize(false);
        this.addClass('selected');
        return this.selectize(value, options);
      },

      getSelected: function() {
        return this.select('.selected');
      },

      scaleFactor: function() {
        if (this.node.hasAttribute('viewBox')) {
          return {
            x: this.width() / this.viewbox().width,
            y: this.height() / this.viewbox().height
          };
        }
        return { x: 1, y: 1 };
      }
    });
  }

  draw(): any {
    if (!this._draw) {
      this._draw = SVG(this.rootId());
    }
    return this._draw;
  }

  get(id: string): SVG.Element {
    return SVG.get(id);
  }

  svg(): any {
    return SVG;
  }

  rootId(): string {
    return 'canvas';
  }
}
