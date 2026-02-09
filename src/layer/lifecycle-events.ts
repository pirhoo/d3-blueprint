import { assert } from '../utils/index.js';

/** Ordered D3 data-join lifecycle event names. */
export const LIFECYCLE_EVENT_NAMES = [
  'update',
  'enter',
  'merge',
  'exit',
] as const;

/** Base lifecycle event name. */
export type LifecycleEventName = typeof LIFECYCLE_EVENT_NAMES[number];

/** Any valid lifecycle event key, including `:transition` variants. */
export type LifecycleEventKey =
  | LifecycleEventName
  | `${LifecycleEventName}:transition`;

const validKeys = new Set<string>([
  ...LIFECYCLE_EVENT_NAMES,
  ...LIFECYCLE_EVENT_NAMES.map(name => `${name}:transition`),
]);

/** Returns `true` if the given string is a valid lifecycle event key. */
export function isValidLifecycleEvent(key: string): key is LifecycleEventKey {
  return validKeys.has(key);
}

/** Throws if the given string is not a valid lifecycle event key. */
export function assertLifecycleEvent(key: string): asserts key is LifecycleEventKey {
  assert(
    isValidLifecycleEvent(key),
    `"${key}" is not a valid lifecycle event. Expected one of: ${[...validKeys].join(', ')}`,
  );
}
