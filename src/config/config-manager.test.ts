import { ConfigManager } from './config-manager.js';

describe('ConfigManager', () => {
  describe('define', () => {
    it('defines a config property with a default value', () => {
      const manager = new ConfigManager();
      manager.define('width', { defaultValue: 100 });
      expect(manager.get('width')).toBe(100);
    });

    it('returns the manager for chaining', () => {
      const manager = new ConfigManager();
      expect(manager.define('x', { defaultValue: 0 })).toBe(manager);
    });

    it('throws if property is already defined', () => {
      const manager = new ConfigManager();
      manager.define('width', { defaultValue: 100 });
      expect(() => manager.define('width', { defaultValue: 200 })).toThrow('[d3compose]');
    });

    it('applies setter transform to the default value', () => {
      const manager = new ConfigManager();
      manager.define('scale', {
        defaultValue: 2,
        setter: (v: number) => v * 10,
      });
      expect(manager.get('scale')).toBe(20);
    });
  });

  describe('get', () => {
    it('returns the stored value', () => {
      const manager = new ConfigManager();
      manager.define('color', { defaultValue: 'red' });
      expect(manager.get('color')).toBe('red');
    });

    it('applies getter transform when reading', () => {
      const manager = new ConfigManager();
      manager.define('label', {
        defaultValue: 'hello',
        getter: (v: string) => v.toUpperCase(),
      });
      expect(manager.get('label')).toBe('HELLO');
    });

    it('throws for undefined properties', () => {
      const manager = new ConfigManager();
      expect(() => manager.get('missing')).toThrow('[d3compose]');
    });
  });

  describe('set', () => {
    it('updates the value of a config property', () => {
      const manager = new ConfigManager();
      manager.define('height', { defaultValue: 50 });
      manager.set('height', 200);
      expect(manager.get('height')).toBe(200);
    });

    it('applies setter transform when writing', () => {
      const manager = new ConfigManager();
      manager.define('margin', {
        defaultValue: 0,
        setter: (v: number) => Math.max(0, v),
      });
      manager.set('margin', -10);
      expect(manager.get('margin')).toBe(0);
    });

    it('returns the manager for chaining', () => {
      const manager = new ConfigManager();
      manager.define('x', { defaultValue: 0 });
      expect(manager.set('x', 5)).toBe(manager);
    });
  });

  describe('setBatch', () => {
    it('sets multiple properties at once', () => {
      const manager = new ConfigManager();
      manager.define('width', { defaultValue: 0 });
      manager.define('height', { defaultValue: 0 });

      manager.setBatch({ width: 100, height: 200 });

      expect(manager.get('width')).toBe(100);
      expect(manager.get('height')).toBe(200);
    });
  });

  describe('getAll', () => {
    it('returns all config values as a plain object', () => {
      const manager = new ConfigManager();
      manager.define('a', { defaultValue: 1 });
      manager.define('b', { defaultValue: 'two' });

      expect(manager.getAll()).toEqual({ a: 1, b: 'two' });
    });
  });

  describe('has', () => {
    it('returns true for defined properties', () => {
      const manager = new ConfigManager();
      manager.define('x', { defaultValue: 0 });
      expect(manager.has('x')).toBe(true);
    });

    it('returns false for undefined properties', () => {
      const manager = new ConfigManager();
      expect(manager.has('nope')).toBe(false);
    });
  });
});
