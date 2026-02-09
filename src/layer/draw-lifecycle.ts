import type { Selection, BaseType } from 'd3-selection';
import type { Transition } from 'd3-transition';
import type { LifecycleHandler, TransitionHandler } from '../types/index.js';
import type { LifecycleEventName } from './lifecycle-events.js';
import { LIFECYCLE_EVENT_NAMES } from './lifecycle-events.js';

/** A resolved phase with its selection and registered handlers. */
export interface LifecyclePhase<TData> {
  name: LifecycleEventName;
  selection: Selection<BaseType, TData, BaseType, unknown>;
  handlers: LifecycleHandler<TData>[];
  transitionHandlers: TransitionHandler<TData>[];
}

/**
 * Builds the ordered lifecycle phases from a data-join result.
 * Each phase maps to a D3 sub-selection (enter, update, merge, exit).
 */
export function buildLifecyclePhases<TData>(
  bound: Selection<BaseType, TData, BaseType, unknown>,
  handlerMap: Map<string, Array<LifecycleHandler<TData> | TransitionHandler<TData>>>,
): LifecyclePhase<TData>[] {
  const entering = bound.enter();
  const exiting = bound.exit<TData>();

  const selectionMap: Record<LifecycleEventName, Selection<BaseType, TData, BaseType, unknown>> = {
    update: bound,
    enter: entering as unknown as Selection<BaseType, TData, BaseType, unknown>,
    merge: entering.merge(bound),
    exit: exiting,
  };

  return LIFECYCLE_EVENT_NAMES.map((name) => {
    const selection = selectionMap[name];
    const handlers = (handlerMap.get(name) ?? []) as LifecycleHandler<TData>[];
    const transitionHandlers = (handlerMap.get(`${name}:transition`) ?? []) as TransitionHandler<TData>[];

    return { name, selection, handlers, transitionHandlers };
  });
}

/** Invokes all non-transition handlers for a phase. */
export function invokeHandlers<TData>(
  selection: Selection<BaseType, TData, BaseType, unknown>,
  handlers: LifecycleHandler<TData>[],
): void {
  for (const handler of handlers) {
    handler(selection);
  }
}

/** Invokes all transition handlers for a phase, returning transition promises. */
export function invokeTransitionHandlers<TData>(
  selection: Selection<BaseType, TData, BaseType, unknown>,
  transitionHandlers: TransitionHandler<TData>[],
): Promise<void>[] {
  return transitionHandlers.map((handler) => {
    const transition = selection.transition() as unknown as Transition<BaseType, TData, BaseType, unknown>;
    handler(transition);
    return createTransitionPromise(transition);
  });
}

/** Wraps a D3 transition's `end()` promise, resolving silently on empty/interrupted transitions. */
export function createTransitionPromise<TData>(
  transition: Transition<BaseType, TData, BaseType, unknown>,
): Promise<void> {
  return transition.end().then(
    () => undefined,
    () => undefined,
  );
}
