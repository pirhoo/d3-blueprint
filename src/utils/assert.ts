/**
 * Asserts a condition is truthy, throwing with a `[d3-blueprint]` prefix if not.
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[d3-blueprint] ${message}`);
  }
}
