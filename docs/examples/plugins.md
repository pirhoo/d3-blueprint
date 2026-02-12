# Plugins

d3-blueprint charts emit lifecycle events (`preDraw`, `postDraw`, `postTransition`) that external code can listen to via `.on()`. A **plugin** is a simple object that hooks into these events to add cross-cutting behavior like tooltips, crosshairs, and hover highlights without modifying the chart class itself.

## The Plugin Interface

A plugin is any object with some or all of these methods:

```js
const myPlugin = {
  name: 'my-plugin',          // used as the event namespace
  install(chart) { },          // called once, immediately
  preDraw(chart, data) { },    // called on every preDraw event
  postDraw(chart, data) { },   // called on every postDraw event
  postTransition(chart, data) { }, // called after transitions complete
  destroy(chart) { },          // called when the chart is destroyed
};
```

Only `install` is required. The rest are optional, so implement only the hooks you need.

## `chart.usePlugin(plugin, name?)`

The `usePlugin` method on `D3Blueprint` wires a plugin into the chart:

```js
class MyChart extends D3Blueprint {
  initialize() {
    // ... set up layers, scales, etc.
    this.usePlugin(myPlugin);
  }
}
```

What it does:

1. Calls `plugin.install(chart)` immediately
2. Registers `plugin.preDraw` / `plugin.postDraw` / `plugin.postTransition` as **namespaced event listeners** (e.g. `postDraw.my-plugin`), so they don't conflict with other plugins or the chart's own hooks
3. Wraps `chart.destroy()` to call `plugin.destroy(chart)` before the original teardown

The optional `name` parameter overrides the namespace (defaults to `plugin.name` or `'plugin'`).

## `tooltipPlugin()`

The first built-in plugin. It encapsulates the `Tooltip` class so you don't have to manually create it in `initialize()` and wire events in `postDraw()`.

```js
import { tooltipPlugin } from './plugins/tooltipPlugin.js';

class BarChart extends D3Blueprint {
  initialize() {
    this.chart = this.base.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // ... set up layers, axes, etc.

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.usePlugin(tooltipPlugin({
      parent: this.chart,
      width: innerWidth,
      height: innerHeight,
      bind: (chart, tooltip) => {
        chart.bars.base.selectAll('rect')
          .on('mouseenter', function (event, d) {
            select(this).attr('opacity', 0.8);
            tooltip.show(
              chart.xScale(d.label) + chart.xScale.bandwidth(),
              chart.yScale(d.value),
              `${d.label}: ${d.value}`,
            );
          })
          .on('mouseleave', function () {
            select(this).attr('opacity', 1);
            tooltip.hide();
          });
      },
    }));
  }

  // No postDraw() needed. The plugin handles tooltip wiring.
}
```

### Options

| Option | Type | Description |
|---|---|---|
| `parent` | d3 selection | The SVG group to append the tooltip to |
| `width` | number | Container width for edge-aware positioning |
| `height` | number | Container height for edge-aware positioning |
| `bind` | function | `bind(chart, tooltip, data)`, called on every `postDraw` to wire DOM events |

The `bind` callback runs after layers draw, giving full access to:
- **`chart`**: the chart instance (scales, layers, config, etc.)
- **`tooltip`**: the `Tooltip` instance (call `.show()` / `.hide()`)
- **`data`**: the current dataset

### Dynamic Dimensions

For responsive charts where dimensions change on resize, update the tooltip's container bounds inside `bind`:

```js
this.usePlugin(tooltipPlugin({
  parent: this.chart,
  bind: (chart, tooltip) => {
    const width = chart.config('width') - MARGIN.left - MARGIN.right;
    const height = chart.config('height') - MARGIN.top - MARGIN.bottom;
    tooltip.containerWidth = width;
    tooltip.containerHeight = height;

    chart.bars.base.selectAll('rect')
      .on('mouseenter', function (event, d) { /* ... */ })
      .on('mouseleave', function () { tooltip.hide(); });
  },
}));
```

## Before & After

### Before (manual wiring)

```js
import { Tooltip } from './charts/Tooltip.js';

class MyChart extends D3Blueprint {
  initialize() {
    // ... layers, axes, etc.
    this.tooltip = new Tooltip(this.chart, { width, height });
  }

  postDraw(data) {
    const tooltip = this.tooltip;
    this.chart.selectAll('.dots circle')
      .on('mouseenter', function (event, d) {
        tooltip.show(xScale(d.x), yScale(d.value), `Value: ${d.value}`);
      })
      .on('mouseleave', () => tooltip.hide());
  }
}
```

### After (plugin)

```js
import { tooltipPlugin } from './plugins/tooltipPlugin.js';

class MyChart extends D3Blueprint {
  initialize() {
    // ... layers, axes, etc.

    this.usePlugin(tooltipPlugin({
      parent: this.chart,
      width,
      height,
      bind: (chart, tooltip) => {
        chart.chart.selectAll('.dots circle')
          .on('mouseenter', function (event, d) {
            tooltip.show(chart.xScale(d.x), chart.yScale(d.value), `Value: ${d.value}`);
          })
          .on('mouseleave', () => tooltip.hide());
      },
    }));
  }

  // postDraw() is gone. Less boilerplate, same behavior.
}
```

## `responsivePlugin()`

Makes any chart automatically resize when its container dimensions change, using a `ResizeObserver` under the hood.

```js
import { responsivePlugin } from './plugins/responsivePlugin.js';

const container = document.querySelector('#chart');
const svg = select(container).append('svg');

const chart = new MyChart(svg);
chart.config('width', container.clientWidth);

chart.usePlugin(responsivePlugin({
  container,
  getSize: (el) => ({ width: el.clientWidth }),
}));

chart.draw(data);
```

### Options

| Option | Type | Description |
|---|---|---|
| `container` | Element | The DOM element to observe for size changes |
| `getSize` | function | `getSize(container)`, returns an object of config key/value pairs to apply on resize |

### How It Works

1. On `install`, creates a `ResizeObserver` that watches the container element
2. On each `postDraw`, stores the latest dataset
3. When the container resizes, calls `getSize(container)` to compute new config values, applies them via `chart.config()`, and redraws with the stored data
4. On `destroy`, disconnects the observer and clears the stored data

The `getSize` callback gives full control over which config values change on resize. For example, to resize both width and height:

```js
chart.usePlugin(responsivePlugin({
  container,
  getSize: (el) => ({
    width: el.clientWidth,
    height: el.clientHeight,
  }),
}));
```

See the [Responsive Bar Chart](./responsive-bar-chart.md) example for a complete working demo.

## Writing a Custom Plugin

Any object that implements `install()` can be a plugin. Here's a crosshair plugin:

```js
function crosshairPlugin({ parent, height }) {
  return {
    name: 'crosshair',
    install(chart) {
      chart.crosshairLine = parent
        .append('line')
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#999')
        .attr('stroke-dasharray', '4,3')
        .style('display', 'none');
    },
    destroy(chart) {
      chart.crosshairLine?.remove();
      chart.crosshairLine = null;
    },
  };
}
```

Compose multiple plugins on the same chart:

```js
this.usePlugin(crosshairPlugin({ parent: this.chart, height: innerHeight }));
this.usePlugin(tooltipPlugin({ parent: this.chart, width, height, bind: ... }));
```

Each plugin gets its own namespaced event listeners, so they don't interfere with each other.
