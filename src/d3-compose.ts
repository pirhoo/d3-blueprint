import { dispatch, type Dispatch } from 'd3-dispatch';
import type { D3Selection, LayerOptions } from './types/index.js';
import { Layer } from './layer/index.js';
import { ConfigManager, type ConfigDefineOptions } from './config/index.js';
import {
  handleLayerOverloads,
  handleConfigOverloads,
  drawLayers,
  drawAttachments,
} from './d3-compose-helpers.js';

/** Chart-level dispatch event names. */
const CHART_EVENTS = ['preDraw', 'postDraw', 'postTransition'] as const;

/**
 * Base class for composable D3 charts.
 * Subclass and override lifecycle hooks (`initialize`, `transform`, `preDraw`, `postDraw`, `postTransition`).
 */
export class D3Compose<TData = unknown> {
  /** The root D3 selection this chart is attached to. */
  protected readonly base: D3Selection;

  private readonly layers = new Map<string, Layer<TData>>();
  private readonly attachments = new Map<string, D3Compose<TData>>();
  private readonly configs: ConfigManager = new ConfigManager();
  private readonly dispatcher: Dispatch<object>;

  constructor(selection: D3Selection) {
    this.base = selection;
    this.dispatcher = dispatch(...CHART_EVENTS);
    this.initialize();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle hooks (override in subclasses)
  // ---------------------------------------------------------------------------

  /** Called once during construction. Override to set up layers and configs. */
  protected initialize(): void {}

  /** Called at the start of `draw()`. Return transformed data or `undefined` to keep original. */
  protected transform(data: TData): TData {
    return data;
  }

  /** Called before layers are drawn. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected preDraw(data: TData): void {}

  /** Called after all layers have drawn (but before transitions complete). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected postDraw(data: TData): void {}

  /** Called after all transitions have completed. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected postTransition(data: TData): void {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Retrieves an existing layer by name. */
  layer(name: string): Layer<TData>;
  /** Creates and registers a new layer. */
  layer(name: string, selection: D3Selection, options: LayerOptions<TData>): Layer<TData>;
  layer(name: string, selection?: D3Selection, options?: LayerOptions<TData>): Layer<TData> {
    return handleLayerOverloads(this.layers, name, selection, options);
  }

  /** Attaches a sub-chart that will be drawn alongside this chart. */
  attach(name: string, chart: D3Compose<TData>): this {
    this.attachments.set(name, chart);
    return this;
  }

  /** Gets a config value by name. */
  config(name: string): unknown;
  /** Sets a config value by name. */
  config(name: string, value: unknown): this;
  /** Sets multiple config values. */
  config(values: Record<string, unknown>): this;
  config(nameOrObject: string | Record<string, unknown>, value?: unknown): unknown | this {
    return handleConfigOverloads(this.configs, this, nameOrObject, value);
  }

  /** Defines a new config property. */
  configDefine<T>(name: string, options: ConfigDefineOptions<T>): this {
    this.configs.define(name, options);
    return this;
  }

  /** Registers an event listener. Delegates to `d3-dispatch`. */
  on(event: string, listener: (...args: unknown[]) => void): this {
    this.dispatcher.on(event, listener as () => void);
    return this;
  }

  /** Removes an event listener. Pass `null` to remove. */
  off(event: string): this {
    this.dispatcher.on(event, null);
    return this;
  }

  /** Executes the full draw lifecycle. */
  async draw(data: TData): Promise<void> {
    const transformed = this.transform(data);

    this.preDraw(transformed);
    this.dispatcher.call('preDraw', this, transformed);

    const layerPromises = drawLayers(this.layers, transformed);
    const attachPromises = drawAttachments(this.attachments, transformed);

    this.postDraw(transformed);
    this.dispatcher.call('postDraw', this, transformed);

    await Promise.all([...layerPromises, ...attachPromises]);

    this.postTransition(transformed);
    this.dispatcher.call('postTransition', this, transformed);
  }

  /** Tears down the chart, clearing layers and attachments. */
  destroy(): void {
    this.layers.clear();
    this.attachments.clear();
  }
}
