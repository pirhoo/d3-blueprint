# Plugins

Plugins encapsulate cross-cutting behavior that hooks into the chart lifecycle. Instead of manually wiring tooltips, resize observers, or crosshairs in every chart, you write a plugin once and apply it with `usePlugin()`.

## What is a Plugin?

A plugin is a plain object with lifecycle methods that mirror the chart's own hooks:

```js
const myPlugin = {
  name: 'my-plugin',
  install(chart) { },
  preDraw(chart, data) { },
  postDraw(chart, data) { },
  postTransition(chart, data) { },
  destroy(chart) { },
};
```

Only `install` is required. Implement the others as needed.

## Registering a Plugin

Call `usePlugin()` inside `initialize()` to wire a plugin into the chart:

```js
class MyChart extends D3Blueprint {
  initialize() {
    // layers, scales, etc.

    this.usePlugin(myPlugin);
  }
}
```

Under the hood, `usePlugin()`:

1. Calls `plugin.install(chart)` immediately
2. Registers `preDraw`, `postDraw`, and `postTransition` as **namespaced event listeners** (e.g. `postDraw.my-plugin`), so plugins never conflict with each other
3. Wraps `chart.destroy()` to call `plugin.destroy(chart)` before teardown

The optional second argument overrides the namespace:

```js
this.usePlugin(myPlugin, 'custom-namespace');
```

## Built-in Plugins

### `tooltipPlugin`

A factory that returns a tooltip plugin. Pass the SVG group (for coordinate conversion) and a `bind` callback that wires mouse events:

```js
import { tooltipPlugin } from './plugins/Tooltip.js';

this.usePlugin(tooltipPlugin(this.chart, (chart, tooltip) => {
  chart.bars.base.selectAll('rect')
    .on('mouseenter', function (event, d) {
      tooltip.show(x(d.label) + x.bandwidth(), y(d.value), d.label);
    })
    .on('mouseleave', () => tooltip.hide());
}));
```

The `bind` callback runs on every `postDraw`, giving access to the chart, the tooltip instance, and the current data.

### `responsivePlugin`

Observes a container element for size changes and redraws the chart automatically:

```js
import { responsivePlugin } from './plugins/responsivePlugin.js';

chart.usePlugin(responsivePlugin({
  container: document.querySelector('#chart'),
  getSize: (el) => ({ width: el.clientWidth }),
}));
```

On resize, the plugin calls `getSize()` to compute new config values, applies them with `chart.config()`, and redraws with the last dataset.

## Writing Your Own

Any object with an `install` method can be a plugin. Here is a crosshair that draws a vertical dashed line:

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

## Composing Multiple Plugins

Stack as many plugins as you need. Each gets its own event namespace:

```js
this.usePlugin(tooltipPlugin(this.chart, ...));
this.usePlugin(crosshairPlugin({ ... }));
this.usePlugin(responsivePlugin({ ... }));
```

## Further Reading

- [Plugins reference](/examples/plugins) for detailed API, options tables, and before/after comparisons
- [Responsive Bar Chart](/examples/responsive-bar-chart) for a working `responsivePlugin` demo
- [Events](/guide/events) for the underlying chart event system plugins build on
