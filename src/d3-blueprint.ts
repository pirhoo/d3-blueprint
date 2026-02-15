import { dispatch, type Dispatch } from 'd3-dispatch';
import type { D3Selection, LayerOptions } from './types/index.js';
import { Layer } from './layer/index.js';
import { ConfigManager, type ConfigDefineOptions } from './config/index.js';
import {
  handleLayerOverloads,
  handleConfigOverloads,
  drawLayers,
  drawAttachments,
} from './d3-blueprint-helpers.js';

/** Chart-level dispatch event names. */
const CHART_EVENTS = ['preDraw', 'postDraw', 'postTransition'] as const;

/** A plugin object that hooks into the chart lifecycle. */
export interface Plugin<TData = unknown> {
  /** Used as the event namespace (e.g. `postDraw.tooltip`). */
  name?: string;
  /** Called once immediately when the plugin is installed. */
  install(chart: D3Blueprint<TData>): void;
  /** Called on every preDraw event. */
  preDraw?(chart: D3Blueprint<TData>, data: TData): void;
  /** Called on every postDraw event. */
  postDraw?(chart: D3Blueprint<TData>, data: TData): void;
  /** Called after all transitions have completed. */
  postTransition?(chart: D3Blueprint<TData>, data: TData): void;
  /** Called when the chart is destroyed. */
  destroy?(chart: D3Blueprint<TData>): void;
}

/** Constructor type for D3Blueprint subclasses. */
type D3BlueprintConstructor<TData, C extends D3Blueprint<TData>> = new (selection: D3Selection) => C;

/**
 * Base class for composable D3 charts.
 * Subclass and override lifecycle hooks (`initialize`, `transform`, `preDraw`, `postDraw`, `postTransition`).
 */
export class D3Blueprint<TData = unknown> {
  /** The root D3 selection this chart is attached to. */
  protected readonly base: D3Selection;

  private readonly layers = new Map<string, Layer<TData>>();
  private readonly attachments = new Map<string, D3Blueprint<TData>>();
  private readonly configs: ConfigManager = new ConfigManager();
  private readonly dispatcher: Dispatch<object>;

  /**
   * Proxy that provides getter access to attached sub-charts by name.
   *
   * @example
   * this.attach('axes', AxisChart, chartGroup);
   * this.attached.axes.config({ xScale, yScale });
   */
  readonly attached: Record<string, D3Blueprint<TData>> = new Proxy(
    {} as Record<string, D3Blueprint<TData>>,
    {
      get: (_target, prop: string) => {
        const chart = this.attachments.get(prop);
        if (!chart) {
          throw new Error(`[d3-blueprint] attachment "${prop}" is not defined`);
        }
        return chart;
      },
      has: (_target, prop: string) => {
        return this.attachments.has(prop);
      },
    },
  );

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

  /** Attaches a sub-chart instance that will be drawn alongside this chart (legacy). */
  attach(name: string, chart: D3Blueprint<TData>): this;
  /** Creates and attaches a sub-chart from a class and selection. */
  attach<C extends D3Blueprint<TData>>(name: string, ChartClass: D3BlueprintConstructor<TData, C>, selection: D3Selection): this;
  attach<C extends D3Blueprint<TData>>(
    name: string,
    chartOrClass: D3Blueprint<TData> | D3BlueprintConstructor<TData, C>,
    selection?: D3Selection,
  ): this {
    if (selection !== undefined) {
      // New API: attach(name, Class, selection)
      const ChartClass = chartOrClass as D3BlueprintConstructor<TData, C>;
      this.attachments.set(name, new ChartClass(selection));
    } else {
      // Legacy API: attach(name, instance)
      this.attachments.set(name, chartOrClass as D3Blueprint<TData>);
    }
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

  /**
   * Wires a plugin into this chart.
   *
   * 1. Calls `plugin.install(this)` immediately
   * 2. Hooks `preDraw` / `postDraw` / `postTransition` via namespaced events
   * 3. Wraps `destroy()` to call `plugin.destroy(this)` before the original teardown
   */
  usePlugin(plugin: Plugin<TData>, name?: string): this {
    const ns = name || plugin.name || 'plugin';

    plugin.install(this);

    if (plugin.preDraw) {
      this.on(`preDraw.${ns}`, (data: unknown) => plugin.preDraw!(this, data as TData));
    }
    if (plugin.postDraw) {
      this.on(`postDraw.${ns}`, (data: unknown) => plugin.postDraw!(this, data as TData));
    }
    if (plugin.postTransition) {
      this.on(`postTransition.${ns}`, (data: unknown) => plugin.postTransition!(this, data as TData));
    }

    if (plugin.destroy) {
      const origDestroy = this.destroy.bind(this);
      this.destroy = () => {
        plugin.destroy!(this);
        origDestroy();
      };
    }

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
