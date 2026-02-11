import { assert } from './assert.js';

describe('assert', () => {
  it('does not throw when condition is truthy', () => {
    expect(() => assert(true, 'msg')).not.toThrow();
    expect(() => assert(1, 'msg')).not.toThrow();
    expect(() => assert('non-empty', 'msg')).not.toThrow();
  });

  it('throws an error with [d3-blueprint] prefix when condition is falsy', () => {
    expect(() => assert(false, 'something failed')).toThrow('[d3-blueprint] something failed');
  });

  it('throws for all falsy values', () => {
    expect(() => assert(0, 'zero')).toThrow('[d3-blueprint] zero');
    expect(() => assert('', 'empty string')).toThrow('[d3-blueprint] empty string');
    expect(() => assert(null, 'null')).toThrow('[d3-blueprint] null');
    expect(() => assert(undefined, 'undefined')).toThrow('[d3-blueprint] undefined');
  });
});
