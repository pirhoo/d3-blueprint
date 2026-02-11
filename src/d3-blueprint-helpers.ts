import type { D3Selection, LayerOptions } from './types/index.js';
import { Layer } from './layer/index.js';
import { ConfigManager, type ConfigDefineOptions } from './config/index.js';

/**
 * Resolves the overloaded `layer()` call.
 * - `layer(name)` → returns existing layer
 * - `layer(name, selection, options)` → creates and stores a new layer
 */
export function handleLayerOverloads<TData>(
  layers: Map<string, Layer<TData>>,
  name: string,
  selection?: D3Selection,
  options?: LayerOptions<TData>,
): Layer<TData> {
  if (selection && options) {
    const layer = new Layer<TData>(selection, options);
    layers.set(name, layer);
    return layer;
  }

  const existing = layers.get(name);
  if (!existing) {
    throw new Error(`[d3-blueprint] layer "${name}" is not defined`);
  }
  return existing;
}

/**
 * Resolves the overloaded `config()` call.
 * - `config(name)` → returns value
 * - `config(name, value)` → sets value, returns the chart
 * - `config(object)` → sets multiple, returns the chart
 */
export function handleConfigOverloads<TChart>(
  manager: ConfigManager,
  chart: TChart,
  nameOrObject: string | Record<string, unknown>,
  value?: unknown,
): unknown | TChart {
  if (typeof nameOrObject === 'string' && value === undefined) {
    return manager.get(nameOrObject);
  }

  if (typeof nameOrObject === 'string') {
    manager.set(nameOrObject, value);
    return chart;
  }

  manager.setBatch(nameOrObject);
  return chart;
}

/** Re-export ConfigDefineOptions for convenience. */
export type { ConfigDefineOptions };

/** Draws all layers with the given data. Returns promises from each layer. */
export function drawLayers<TData>(
  layers: Map<string, Layer<TData>>,
  data: TData,
): Promise<void>[] {
  const promises: Promise<void>[] = [];
  for (const layer of layers.values()) {
    promises.push(layer.draw(data));
  }
  return promises;
}

/** Draws all attached sub-charts with the given data. */
export function drawAttachments<TData>(
  attachments: Map<string, { draw: (data: TData) => Promise<void> | void }>,
  data: TData,
): Promise<void>[] {
  const promises: Promise<void>[] = [];
  for (const chart of attachments.values()) {
    const result = chart.draw(data);
    if (result) {
      promises.push(result);
    }
  }
  return promises;
}
