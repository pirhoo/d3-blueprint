import type { Selection, BaseType } from 'd3-selection';
import type { Transition } from 'd3-transition';
import type { LifecycleEventKey } from '../layer/lifecycle-events.js';

/** A generic D3 selection. */
export type D3Selection = Selection<BaseType, unknown, BaseType, unknown>;

/** A generic D3 transition. */
export type D3Transition = Transition<BaseType, unknown, BaseType, unknown>;

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
