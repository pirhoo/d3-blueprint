import type {
  D3Selection,
  LifecycleHandler,
  TransitionHandler,
  LayerOptions,
} from '../types/index.js';
import type { LifecycleEventKey } from './lifecycle-events.js';
import { assertLifecycleEvent } from './lifecycle-events.js';
import {
  buildLifecyclePhases,
  invokeHandlers,
  invokeTransitionHandlers,
} from './draw-lifecycle.js';

/**
 * A Layer manages a single D3 data-join lifecycle (bindData → insert → enter/update/merge/exit).
 */
export class Layer<TData = unknown> {
  private readonly base: D3Selection;
  private readonly dataBindFn: LayerOptions<TData>['dataBind'];
  private readonly insertFn: LayerOptions<TData>['insert'];
  private readonly handlers = new Map<string, Array<LifecycleHandler<TData> | TransitionHandler<TData>>>();

  constructor(base: D3Selection, options: LayerOptions<TData>) {
    this.base = base;
    this.dataBindFn = options.dataBind;
    this.insertFn = options.insert;

    if (options.events) {
      for (const [key, handler] of Object.entries(options.events)) {
        if (handler) {
          this.on(key as LifecycleEventKey, handler);
        }
      }
    }
  }

  /** Registers a handler for the given lifecycle event. */
  on(
    eventKey: LifecycleEventKey,
    handler: LifecycleHandler<TData> | TransitionHandler<TData>,
  ): this {
    assertLifecycleEvent(eventKey);

    const list = this.handlers.get(eventKey) ?? [];
    list.push(handler);
    this.handlers.set(eventKey, list);

    return this;
  }

  /** Removes a specific handler, or all handlers for the given lifecycle event. */
  off(
    eventKey: LifecycleEventKey,
    handler?: LifecycleHandler<TData> | TransitionHandler<TData>,
  ): this {
    assertLifecycleEvent(eventKey);

    if (!handler) {
      this.handlers.delete(eventKey);
      return this;
    }

    const list = this.handlers.get(eventKey);
    if (list) {
      const index = list.indexOf(handler);
      if (index !== -1) {
        list.splice(index, 1);
      }
    }

    return this;
  }

  /** Executes the full data-join lifecycle. Returns a promise that resolves when all transitions complete. */
  draw(data: TData): Promise<void> {
    const bound = this.dataBindFn(this.base, data);
    const entering = bound.enter();
    this.insertFn(entering as unknown as D3Selection);

    const phases = buildLifecyclePhases<TData>(bound, this.handlers);
    const transitionPromises: Promise<void>[] = [];

    for (const phase of phases) {
      invokeHandlers(phase.selection, phase.handlers);
      const promises = invokeTransitionHandlers(phase.selection, phase.transitionHandlers);
      transitionPromises.push(...promises);
    }

    return Promise.all(transitionPromises).then(() => undefined);
  }
}
