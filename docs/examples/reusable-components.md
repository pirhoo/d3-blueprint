# Reusable Components

d3-blueprint's `attach()` API lets you compose charts from smaller, reusable building blocks. Instead of every chart duplicating margin setup, axis rendering, and scale calculations, you extract common concerns into standalone components and wire them together.

This page walks through two reusable components, **AxisChart** and **BarsChart**, that are used across every example in this documentation.

## How `attach()` Works

When a parent chart calls `draw(data)`, the lifecycle runs in this order:

```
Parent.draw(data)
  ├── transform(data)
  ├── preDraw(data)         ← parent computes scales, sets config on attachments
  ├── drawLayers(data)      ← parent's own layers
  ├── drawAttachments(data) ← each attachment.draw(data) runs here
  │     ├── AxisChart.preDraw()  ← reads scales from config, renders axes
  │     └── BarsChart.draw()     ← bars layer runs with configured scales
  └── postDraw(data)
```

The key insight: the parent's `preDraw()` runs **before** `drawAttachments()`, so the parent can set config on its attachments (scales, dimensions) and those values are available when each attachment draws.

## AxisChart

A reusable axis renderer using [NYT-style axes](https://observablehq.com/@observablehq/plot-nyt-style-axes): no domain lines, no tick marks on the x-axis, and dashed horizontal grid lines from the y-axis spanning the full chart width.

```js
import { axisBottom, axisLeft } from 'd3-axis';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

class AxisChart extends D3Blueprint {
  initialize() {
    this.configDefine('xScale', { defaultValue: null });
    this.configDefine('yScale', { defaultValue: null });
    this.configDefine('innerWidth', { defaultValue: 0 });
    this.configDefine('innerHeight', { defaultValue: 0 });
    this.configDefine('duration', { defaultValue: 750 });
    this.configDefine('xTickCount', { defaultValue: undefined });
    this.configDefine('yTickCount', { defaultValue: undefined });

    this.xAxisGroup = this.base.append('g').attr('class', 'x-axis');
    this.yAxisGroup = this.base.append('g').attr('class', 'y-axis');
  }

  preDraw() {
    const xScale = this.config('xScale');
    const yScale = this.config('yScale');
    if (!xScale || !yScale) return;

    const innerWidth = this.config('innerWidth');
    const innerHeight = this.config('innerHeight');
    const duration = this.config('duration');
    const xTickCount = this.config('xTickCount');
    const yTickCount = this.config('yTickCount');

    // X-axis: labels only, no tick marks (NYT style)
    const xAxis = axisBottom(xScale).tickSize(0).tickPadding(10);
    if (xTickCount != null) xAxis.ticks(xTickCount);

    this.xAxisGroup
      .attr('transform', `translate(0,${innerHeight})`)
      .transition()
      .duration(duration)
      .call(xAxis);

    this.xAxisGroup.select('.domain').remove();

    // Y-axis: grid lines span the full chart width (NYT style)
    const yAxis = axisLeft(yScale).tickSize(-innerWidth).tickPadding(10);
    if (yTickCount != null) yAxis.ticks(yTickCount);

    this.yAxisGroup.transition().duration(duration).call(yAxis);

    this.yAxisGroup.select('.domain').remove();
  }
}
```

### Config Properties

| Config | Type | Default | Description |
|---|---|---|---|
| `xScale` | d3 scale | `null` | Scale for the x-axis (e.g. `scaleBand`, `scaleLinear`) |
| `yScale` | d3 scale | `null` | Scale for the y-axis |
| `innerWidth` | number | `0` | Chart area width, which sets the extent of y-axis grid lines |
| `innerHeight` | number | `0` | Chart area height, which positions the x-axis |
| `duration` | number | `750` | Transition duration in ms |
| `xTickCount` | number | `undefined` | Optional tick count for the x-axis |
| `yTickCount` | number | `undefined` | Optional tick count for the y-axis |

## BarsChart

A reusable bar renderer with enter/exit transitions. It defines a single `bars` layer and reads all positioning info from config.

```js
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

class BarsChart extends D3Blueprint {
  initialize() {
    this.configDefine('xScale', { defaultValue: null });
    this.configDefine('yScale', { defaultValue: null });
    this.configDefine('innerHeight', { defaultValue: 0 });
    this.configDefine('fill', { defaultValue: 'steelblue' });
    this.configDefine('duration', { defaultValue: 750 });
    this.configDefine('rx', { defaultValue: 0 });

    this.layer('bars', this.base, {
      dataBind: (selection, data) => {
        return selection.selectAll('rect').data(data, (d) => d.label);
      },
      insert: (selection) => {
        return selection.append('rect');
      },
      events: {
        enter: (selection) => {
          const xScale = this.config('xScale');
          const innerHeight = this.config('innerHeight');
          selection
            .attr('x', (d) => xScale(d.label))
            .attr('width', xScale.bandwidth())
            .attr('y', innerHeight)
            .attr('height', 0)
            .attr('rx', this.config('rx'))
            .attr('fill', this.config('fill'));
        },
        'enter:transition': (transition) => {
          const yScale = this.config('yScale');
          const innerHeight = this.config('innerHeight');
          transition
            .duration(this.config('duration'))
            .attr('y', (d) => yScale(d.value))
            .attr('height', (d) => innerHeight - yScale(d.value));
        },
        'merge:transition': (transition) => {
          const xScale = this.config('xScale');
          const yScale = this.config('yScale');
          const innerHeight = this.config('innerHeight');
          transition
            .duration(this.config('duration'))
            .attr('x', (d) => xScale(d.label))
            .attr('width', xScale.bandwidth())
            .attr('y', (d) => yScale(d.value))
            .attr('height', (d) => innerHeight - yScale(d.value));
        },
        'exit:transition': (transition) => {
          transition
            .duration(Math.round(this.config('duration') * 0.4))
            .attr('opacity', 0)
            .remove();
        },
      },
    });
  }
}
```

### Config Properties

| Config | Type | Default | Description |
|---|---|---|---|
| `xScale` | `scaleBand` | `null` | Band scale for x positioning |
| `yScale` | `scaleLinear` | `null` | Linear scale for y positioning |
| `innerHeight` | number | `0` | Chart area height (bars grow upward from here) |
| `fill` | string | `'steelblue'` | Bar fill color |
| `duration` | number | `750` | Transition duration in ms |
| `rx` | number | `0` | Border radius for bars |

## Composing a Bar Chart

With both components available, a bar chart becomes minimal:

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';

const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };

class BarChart extends D3Blueprint {
  initialize() {
    const chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Create and attach reusable components
    this.attach('axes', AxisChart, chart);
    this.attach('bars', BarsChart, chart.append('g').classed('bars', true));
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    const xScale = scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = scaleLinear()
      .domain([0, max(data, (d) => d.value) ?? 0])
      .range([innerHeight, 0]);

    // Configure attachments. They'll read these when they draw.
    this.attached.axes.config({ xScale, yScale, innerWidth, innerHeight });
    this.attached.bars.config({ xScale, yScale, innerHeight, fill: 'steelblue' });
  }
}
```

The parent chart owns the data and scales. The attachments own their rendering. This separation means:

- **AxisChart** can be reused in line charts, stacked charts, or any chart with axes
- **BarsChart** can be swapped out for a different renderer without touching the axis logic
- Each component is independently testable and configurable

## Tooltip

Unlike AxisChart and BarsChart, Tooltip is **not** a D3Blueprint subclass — it's a [plugin](/guide/plugins) that implements the Plugin interface directly. It renders an HTML `<div>` positioned with [floating-ui](https://floating-ui.com), converting SVG-local coordinates to screen coordinates via `getScreenCTM()`. Edge-aware positioning is handled automatically by floating-ui's `flip()` and `shift()` middleware.

```js
import { Tooltip } from './plugins/Tooltip.js';

this.usePlugin(new Tooltip(this.chart, (chart, tooltip) => {
  chart.attached.bars.base.selectAll('rect')
    .on('mouseenter', function (event, d) {
      tooltip.show(x(d.label) + x.bandwidth(), y(d.value), `${d.label}: ${d.value}`);
    })
    .on('mouseleave', () => tooltip.hide());
}));
```

### Constructor

```js
new Tooltip(parent, bind)
```

| Argument | Type | Description |
|---|---|---|
| `parent` | d3 selection | SVG group used for coordinate conversion |
| `bind` | function | `bind(chart, tooltip, data)` — called on every `postDraw` to wire DOM events |

### Instance Methods

| Method | Description |
|---|---|
| `show(x, y, lines)` | Positions and reveals the tooltip. `x`/`y` are SVG-local coordinates. `lines` is a string or array of `{ text, color? }`. |
| `hide()` | Hides the tooltip. |

See [Plugins](/examples/plugins) for the full API reference and before/after comparisons.

## Examples Using This Pattern

Every example in this documentation composes charts using `attach()`:

- [Bar Chart](/examples/bar-chart): AxisChart + BarsChart + Tooltip
- [Responsive Bar Chart](/examples/responsive-bar-chart): AxisChart + BarsChart + Tooltip + ResizeObserver
- [Line Chart](/examples/line-chart): AxisChart + inline line/dots layers + Tooltip
- [Multiline Chart](/examples/multiline-chart): AxisChart + inline multiline/labels layers + crosshair Tooltip
- [Stacked Columns](/examples/stacked-columns): AxisChart + inline stacks/legend layers + Tooltip
