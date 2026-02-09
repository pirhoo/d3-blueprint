/**
 * Asserts a condition is truthy, throwing with a `[d3compose]` prefix if not.
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[d3compose] ${message}`);
  }
}
