import { jest } from '@jest/globals';
import { select } from 'd3-selection';
import 'd3-transition';
import { D3Blueprint } from './d3-blueprint.js';
import { Layer } from './layer/index.js';

function createBase(): ReturnType<typeof select> {
  const div = document.createElement('div');
  document.body.appendChild(div);
  return select(div);
}

function cleanupBody(): void {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
}

describe('D3Blueprint', () => {
  afterEach(() => {
    cleanupBody();
  });

  describe('constructor', () => {
    it('stores the base selection', () => {
      const base = createBase();
      const chart = new D3Blueprint(base);
      expect(chart).toBeInstanceOf(D3Blueprint);
    });

    it('calls initialize on construction', () => {
      const spy = jest.fn();

      class TestChart extends D3Blueprint {
        protected override initialize(): void {
          spy();
        }
      }

      new TestChart(createBase());
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('layer', () => {
    it('creates and retrieves a layer', () => {
      const base = createBase();
      const chart = new D3Blueprint<number[]>(base);
      const g = base.append('g');

      const layer = chart.layer('bars', g, {
        dataBind: (sel, data) => sel.selectAll('rect').data(data),
        insert: sel => sel.append('rect'),
      });

      expect(layer).toBeInstanceOf(Layer);
      expect(chart.layer('bars')).toBe(layer);
    });

    it('throws for unknown layer name', () => {
      const chart = new D3Blueprint(createBase());
      expect(() => chart.layer('nope')).toThrow('[d3-blueprint]');
    });
  });

  describe('attach', () => {
    it('attaches a sub-chart and draws it', async () => {
      const base = createBase();
      const chart = new D3Blueprint<number[]>(base);
      const drawSpy = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

      const subChart = new D3Blueprint<number[]>(base);
      subChart.draw = drawSpy;

      chart.attach('sub', subChart);
      await chart.draw([1, 2]);

      expect(drawSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('config', () => {
    it('defines and retrieves a config value', () => {
      const chart = new D3Blueprint(createBase());
      chart.configDefine('width', { defaultValue: 500 });

      expect(chart.config('width')).toBe(500);
    });

    it('sets a config value by name', () => {
      const chart = new D3Blueprint(createBase());
      chart.configDefine('height', { defaultValue: 100 });
      chart.config('height', 200);

      expect(chart.config('height')).toBe(200);
    });

    it('sets multiple config values with an object', () => {
      const chart = new D3Blueprint(createBase());
      chart.configDefine('width', { defaultValue: 0 });
      chart.configDefine('height', { defaultValue: 0 });

      chart.config({ width: 400, height: 300 });

      expect(chart.config('width')).toBe(400);
      expect(chart.config('height')).toBe(300);
    });

    it('returns the chart for chaining when setting', () => {
      const chart = new D3Blueprint(createBase());
      chart.configDefine('x', { defaultValue: 0 });

      expect(chart.config('x', 10)).toBe(chart);
      expect(chart.config({ x: 20 })).toBe(chart);
    });

    it('supports getter/setter transforms', () => {
      const chart = new D3Blueprint(createBase());
      chart.configDefine('margin', {
        defaultValue: 5,
        setter: (v: number) => Math.max(0, v),
      });

      chart.config('margin', -10);
      expect(chart.config('margin')).toBe(0);
    });
  });

  describe('on / off', () => {
    it('registers and fires preDraw event', async () => {
      const chart = new D3Blueprint(createBase());
      const spy = jest.fn();

      chart.on('preDraw', spy);
      await chart.draw('test-data');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('registers and fires postDraw event', async () => {
      const chart = new D3Blueprint(createBase());
      const spy = jest.fn();

      chart.on('postDraw', spy);
      await chart.draw('test-data');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('registers and fires postTransition event', async () => {
      const chart = new D3Blueprint(createBase());
      const spy = jest.fn();

      chart.on('postTransition', spy);
      await chart.draw('test-data');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('removes listeners with off', async () => {
      const chart = new D3Blueprint(createBase());
      const spy = jest.fn();

      chart.on('preDraw', spy);
      chart.off('preDraw');
      await chart.draw('data');

      expect(spy).not.toHaveBeenCalled();
    });

    it('supports namespaced events', async () => {
      const chart = new D3Blueprint(createBase());
      const spy = jest.fn();

      chart.on('preDraw.myPlugin', spy);
      await chart.draw('data');

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('draw lifecycle', () => {
    it('calls transform with the data', async () => {
      const spy = jest.fn((d: string) => d);

      class TestChart extends D3Blueprint<string> {
        protected override transform(data: string): string {
          spy(data);
          return data;
        }
      }

      const chart = new TestChart(createBase());
      await chart.draw('hello');

      expect(spy).toHaveBeenCalledWith('hello');
    });

    it('uses transformed data in lifecycle hooks', async () => {
      const preDrawSpy = jest.fn();

      class TestChart extends D3Blueprint<number> {
        protected override transform(data: number): number {
          return data * 2;
        }

        protected override preDraw(data: number): void {
          preDrawSpy(data);
        }
      }

      const chart = new TestChart(createBase());
      await chart.draw(5);

      expect(preDrawSpy).toHaveBeenCalledWith(10);
    });

    it('calls hooks in correct order', async () => {
      const order: string[] = [];

      class TestChart extends D3Blueprint<string> {
        protected override transform(data: string): string {
          order.push('transform');
          return data;
        }

        protected override preDraw(): void {
          order.push('preDraw');
        }

        protected override postDraw(): void {
          order.push('postDraw');
        }

        protected override postTransition(): void {
          order.push('postTransition');
        }
      }

      const chart = new TestChart(createBase());
      await chart.draw('data');

      expect(order).toEqual(['transform', 'preDraw', 'postDraw', 'postTransition']);
    });

    it('draws layers during the draw cycle', async () => {
      class TestChart extends D3Blueprint<number[]> {
        protected override initialize(): void {
          const g = this.base.append('g');
          this.layer('items', g, {
            dataBind: (sel, data) => sel.selectAll('span').data(data),
            insert: sel => sel.append('span'),
          });
        }
      }

      const base = createBase();
      const chart = new TestChart(base);
      await chart.draw([1, 2, 3]);

      expect(base.selectAll('span').size()).toBe(3);
    });
  });

  describe('destroy', () => {
    it('clears layers and attachments', async () => {
      class TestChart extends D3Blueprint<number[]> {
        protected override initialize(): void {
          const g = this.base.append('g');
          this.layer('items', g, {
            dataBind: (sel, data) => sel.selectAll('span').data(data),
            insert: sel => sel.append('span'),
          });
        }
      }

      const chart = new TestChart(createBase());
      chart.destroy();

      expect(() => chart.layer('items')).toThrow('[d3-blueprint]');
    });
  });
});
