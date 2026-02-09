import { jest } from '@jest/globals';
import { select } from 'd3-selection';
import 'd3-transition';
import { Layer } from './layer.js';
import type { LayerOptions } from '../types/index.js';

function createBase(): ReturnType<typeof select> {
  const div = document.createElement('div');
  document.body.appendChild(div);
  return select(div);
}

function defaultOptions(overrides: Partial<LayerOptions<number[]>> = {}): LayerOptions<number[]> {
  return {
    dataBind(selection, data) {
      return selection.selectAll('span').data(data);
    },
    insert(selection) {
      return selection.append('span');
    },
    ...overrides,
  };
}

function cleanupBody(): void {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
}

describe('Layer', () => {
  afterEach(() => {
    cleanupBody();
  });

  describe('constructor', () => {
    it('creates a layer without events', () => {
      const base = createBase();
      const layer = new Layer(base, defaultOptions());
      expect(layer).toBeInstanceOf(Layer);
    });

    it('registers initial events from options', () => {
      const base = createBase();
      const enterSpy = jest.fn();
      const layer = new Layer(base, defaultOptions({
        events: { enter: enterSpy },
      }));
      expect(layer).toBeInstanceOf(Layer);
    });
  });

  describe('on / off', () => {
    it('registers and invokes a handler on draw', async () => {
      const base = createBase();
      const layer = new Layer<number[]>(base, defaultOptions());
      const enterSpy = jest.fn();

      layer.on('enter', enterSpy);
      await layer.draw([1, 2, 3]);

      expect(enterSpy).toHaveBeenCalledTimes(1);
    });

    it('supports multiple handlers for the same event', async () => {
      const base = createBase();
      const layer = new Layer<number[]>(base, defaultOptions());
      const spy1 = jest.fn();
      const spy2 = jest.fn();

      layer.on('enter', spy1);
      layer.on('enter', spy2);
      await layer.draw([1, 2]);

      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledTimes(1);
    });

    it('removes a specific handler with off', async () => {
      const base = createBase();
      const layer = new Layer<number[]>(base, defaultOptions());
      const spy = jest.fn();

      layer.on('enter', spy);
      layer.off('enter', spy);
      await layer.draw([1]);

      expect(spy).not.toHaveBeenCalled();
    });

    it('removes all handlers for an event when called without handler', async () => {
      const base = createBase();
      const layer = new Layer<number[]>(base, defaultOptions());
      const spy1 = jest.fn();
      const spy2 = jest.fn();

      layer.on('enter', spy1);
      layer.on('enter', spy2);
      layer.off('enter');
      await layer.draw([1]);

      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
    });

    it('returns the layer for chaining', () => {
      const base = createBase();
      const layer = new Layer(base, defaultOptions());

      expect(layer.on('enter', jest.fn())).toBe(layer);
      expect(layer.off('enter')).toBe(layer);
    });

    it('throws for invalid event names', () => {
      const base = createBase();
      const layer = new Layer(base, defaultOptions());

      expect(() => layer.on('bogus' as never, jest.fn())).toThrow('[d3compose]');
      expect(() => layer.off('bogus' as never)).toThrow('[d3compose]');
    });
  });

  describe('draw', () => {
    it('creates DOM elements via insert', async () => {
      const base = createBase();
      const layer = new Layer<number[]>(base, defaultOptions());

      await layer.draw([1, 2, 3]);

      expect(base.selectAll('span').size()).toBe(3);
    });

    it('invokes enter handlers on first draw', async () => {
      const base = createBase();
      const enterSpy = jest.fn();
      const layer = new Layer<number[]>(base, defaultOptions({
        events: { enter: enterSpy },
      }));

      await layer.draw([1, 2]);

      expect(enterSpy).toHaveBeenCalledTimes(1);
    });

    it('invokes update handlers on subsequent draw', async () => {
      const base = createBase();
      const updateSpy = jest.fn();
      const layer = new Layer<number[]>(base, defaultOptions());
      layer.on('update', updateSpy);

      await layer.draw([1, 2]);
      await layer.draw([3, 4]);

      expect(updateSpy).toHaveBeenCalledTimes(2);
    });

    it('invokes exit handlers when data shrinks', async () => {
      const base = createBase();
      const exitSpy = jest.fn();
      const layer = new Layer<number[]>(base, defaultOptions());
      layer.on('exit', exitSpy);

      await layer.draw([1, 2, 3]);
      await layer.draw([1]);

      expect(exitSpy).toHaveBeenCalledTimes(2);
    });

    it('invokes merge handlers', async () => {
      const base = createBase();
      const mergeSpy = jest.fn();
      const layer = new Layer<number[]>(base, defaultOptions());
      layer.on('merge', mergeSpy);

      await layer.draw([1, 2]);

      expect(mergeSpy).toHaveBeenCalledTimes(1);
    });

    it('invokes transition handlers', async () => {
      const base = createBase();
      const transitionSpy = jest.fn();
      const layer = new Layer<number[]>(base, defaultOptions());
      layer.on('enter:transition', transitionSpy);

      await layer.draw([1, 2]);

      expect(transitionSpy).toHaveBeenCalledTimes(1);
    });

    it('returns a promise that resolves', async () => {
      const base = createBase();
      const layer = new Layer<number[]>(base, defaultOptions());

      const result = layer.draw([1]);
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    it('handles empty data gracefully', async () => {
      const base = createBase();
      const layer = new Layer<number[]>(base, defaultOptions());

      await expect(layer.draw([])).resolves.toBeUndefined();
      expect(base.selectAll('span').size()).toBe(0);
    });

    it('executes all four lifecycle phases in order', async () => {
      const base = createBase();
      const order: string[] = [];
      const layer = new Layer<number[]>(base, defaultOptions());

      layer.on('update', () => order.push('update'));
      layer.on('enter', () => order.push('enter'));
      layer.on('merge', () => order.push('merge'));
      layer.on('exit', () => order.push('exit'));

      await layer.draw([1, 2]);

      expect(order).toEqual(['update', 'enter', 'merge', 'exit']);
    });
  });
});
