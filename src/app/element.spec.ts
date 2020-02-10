/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';

import { Area } from './designs/area';
import { Element } from './element';
import { Side } from './designs/side';

describe('Element', () => {
  describe('JSON serialization/deserialization', () => {
    it('should be able to save to JSON', async(() => {
      const side = new Side(null, 'test', null);
      const area = new Area(null, side, 0, null, null);
      const element = new Element(area);

      expect(element.toJson()).toEqual({
        type: 'Element',
        id: undefined,
        data: {
          rotationDegrees: 0,
          flipAxis: '',
        },
        effects: [],
      });
    }));

    it('should be able to load from JSON', async(() => {
      const side = new Side(null, 'test', null);
      const area = new Area(null, side, 0, null, null);
      const element = new Element(area);
      element.fromJson({
        type: 'Element',
        id: undefined,
        data: {
          rotationDegrees: 0,
          flipAxis: 'y',
        },
        effects: [],
      });

      expect(element.id).toBeUndefined();
      expect(element.className).toEqual('Element');
      expect(element.rotationDegrees).toEqual(0);
      expect(element.flipAxis).toEqual('y');
      expect(element.effects()).toEqual([]);
    }));
  });
});
