import type { Selection, BaseType } from 'd3-selection';
import type { Transition } from 'd3-transition';
import type { LifecycleEventKey } from '../layer/lifecycle-events.js';

/**
 * A generic D3 selection accepted across the public API. The generics are
 * `any` so callers can pass results of `d3.select(...)` / `d3.selectAll(...)`
 * directly without casting through d3-selection's invariant generics
 * (e.g. `Selection<SVGGElement, unknown, null, undefined>` returned by
 * `d3.select(svgElement)` unifies with this type).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type D3Selection = Selection<any, any, any, any>;

/** A generic D3 transition. See {@link D3Selection} for the widening rationale. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type D3Transition = Transition<any, any, any, any>;

/** Handler invoked during a non-transition lifecycle phase. */
export type LifecycleHandler<TData> = (
  selection: Selection<BaseType, TData, BaseType, unknown>,
) => void;

/** Handler invoked during a `:transition` lifecycle phase. */
export type TransitionHandler<TData> = (
  transition: Transition<BaseType, TData, BaseType, unknown>,
) => void;

/** Event map passed to `Layer` constructor via `events` option. */
export type LayerEventMap<TData> = Partial<
  Record<LifecycleEventKey, LifecycleHandler<TData> | TransitionHandler<TData>>
>;

/** Options accepted by the `Layer` constructor. */
export interface LayerOptions<TData> {
  /** Binds data to the layer's selection. Must return a D3 data-join. */
  dataBind: (selection: D3Selection, data: TData) => D3Selection;
  /** Appends new DOM elements for entering data points. */
  insert: (selection: D3Selection) => D3Selection;
  /** Initial lifecycle event handlers. */
  events?: LayerEventMap<TData>;
}
