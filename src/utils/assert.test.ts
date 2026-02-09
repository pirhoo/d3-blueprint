import { assert } from './assert.js';

describe('assert', () => {
  it('does not throw when condition is truthy', () => {
    expect(() => assert(true, 'msg')).not.toThrow();
    expect(() => assert(1, 'msg')).not.toThrow();
    expect(() => assert('non-empty', 'msg')).not.toThrow();
  });

  it('throws an error with [d3compose] prefix when condition is falsy', () => {
    expect(() => assert(false, 'something failed')).toThrow('[d3compose] something failed');
  });

  it('throws for all falsy values', () => {
    expect(() => assert(0, 'zero')).toThrow('[d3compose] zero');
    expect(() => assert('', 'empty string')).toThrow('[d3compose] empty string');
    expect(() => assert(null, 'null')).toThrow('[d3compose] null');
    expect(() => assert(undefined, 'undefined')).toThrow('[d3compose] undefined');
  });
});
