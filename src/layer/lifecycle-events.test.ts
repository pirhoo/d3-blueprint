import {
  LIFECYCLE_EVENT_NAMES,
  isValidLifecycleEvent,
  assertLifecycleEvent,
} from './lifecycle-events.js';

describe('LIFECYCLE_EVENT_NAMES', () => {
  it('contains the four D3 data-join phases in order', () => {
    expect(LIFECYCLE_EVENT_NAMES).toEqual(['update', 'enter', 'merge', 'exit']);
  });
});

describe('isValidLifecycleEvent', () => {
  it('returns true for base event names', () => {
    expect(isValidLifecycleEvent('enter')).toBe(true);
    expect(isValidLifecycleEvent('update')).toBe(true);
    expect(isValidLifecycleEvent('merge')).toBe(true);
    expect(isValidLifecycleEvent('exit')).toBe(true);
  });

  it('returns true for :transition variants', () => {
    expect(isValidLifecycleEvent('enter:transition')).toBe(true);
    expect(isValidLifecycleEvent('exit:transition')).toBe(true);
  });

  it('returns false for unknown event names', () => {
    expect(isValidLifecycleEvent('click')).toBe(false);
    expect(isValidLifecycleEvent('enter:animate')).toBe(false);
    expect(isValidLifecycleEvent('')).toBe(false);
  });
});

describe('assertLifecycleEvent', () => {
  it('does not throw for valid events', () => {
    expect(() => assertLifecycleEvent('enter')).not.toThrow();
    expect(() => assertLifecycleEvent('merge:transition')).not.toThrow();
  });

  it('throws with descriptive message for invalid events', () => {
    expect(() => assertLifecycleEvent('bogus')).toThrow('[d3-blueprint]');
    expect(() => assertLifecycleEvent('bogus')).toThrow('"bogus" is not a valid lifecycle event');
  });
});
