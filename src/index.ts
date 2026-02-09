export { D3Compose } from './d3-compose.js';
export { Layer } from './layer/index.js';
export { ConfigManager, type ConfigDefineOptions } from './config/index.js';
export {
  LIFECYCLE_EVENT_NAMES,
  type LifecycleEventName,
  type LifecycleEventKey,
  isValidLifecycleEvent,
  assertLifecycleEvent,
} from './layer/index.js';
export type {
  D3Selection,
  D3Transition,
  LifecycleHandler,
  TransitionHandler,
  LayerEventMap,
  LayerOptions,
} from './types/index.js';
