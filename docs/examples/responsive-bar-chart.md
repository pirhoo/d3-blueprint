# Responsive Bar Chart

This example shows how to make a d3-blueprint chart resize to fit its container using the [`responsivePlugin`](./plugins.md#responsiveplugin). The plugin wraps a `ResizeObserver` so you don't need to manage resize listeners yourself. Axes and bars are handled by reusable [AxisChart and BarsChart](./reusable-components.md) attachments.

## Live Preview

<ClientOnly>
  <ResponsiveBarChartDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { AxisChart } from './charts/AxisChart.js';
import { BarsChart } from './charts/BarsChart.js';
import { tooltipPlugin } from './plugins/tooltipPlugin.js';

class ResponsiveBarChart extends D3Blueprint {
  initialize() {
    this.configDefine('width', { defaultValue: 600 });
    this.configDefine('height', { defaultValue: 300 });
    this.configDefine('margin', {
      defaultValue: { top: 20, right: 20, bottom: 30, left: 40 },
    });

    const margin = this.config('margin');
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    this.axes = new AxisChart(this.chart);
    this.attach('axes', this.axes);

    this.bars = new BarsChart(this.chart.append('g').classed('bars', true));
    this.attach('bars', this.bars);

    this.usePlugin(tooltipPlugin({
      parent: this.chart,
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

  preDraw(data) {
    const width = this.config('width');
    const height = this.config('height');
    const margin = this.config('margin');

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Update the SVG and viewBox to match the new width
    this.base.attr('width', width).attr('viewBox', `0 0 ${width} ${height}`);

    this.xScale = scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.1);

    this.yScale = scaleLinear()
      .domain([0, max(data, (d) => d.value) ?? 0])
      .range([innerHeight, 0]);

    this.axes.config({ xScale: this.xScale, yScale: this.yScale, innerWidth, innerHeight, duration: 400 });
    this.bars.config({ xScale: this.xScale, yScale: this.yScale, innerHeight, fill: 'steelblue', duration: 400, rx: 2 });
  }
}
```

## Making It Responsive

The chart class itself knows nothing about the DOM container. It just reads its `width` config. The responsive wiring is handled by the [`responsivePlugin`](./plugins.md#responsiveplugin):

```js
import { select } from 'd3-selection';
import { responsivePlugin } from './plugins/responsivePlugin.js';

const container = document.querySelector('#chart');
const svg = select(container).append('svg').attr('height', 300);

const chart = new ResponsiveBarChart(svg);
chart.config('width', container.clientWidth);

chart.usePlugin(responsivePlugin({
  container,
  getSize: (el) => ({ width: el.clientWidth }),
}));

chart.draw(data);
```

## How It Works

1. **`configDefine('width', ...)`** makes width a runtime-configurable property.
2. **`preDraw()`** reads `this.config('width')` each time `draw()` is called and updates the SVG `width` and `viewBox` attributes so the chart fills the available space.
3. **`responsivePlugin`** wraps a `ResizeObserver` that watches the container element. On resize it calls `getSize()` to compute the new config values, applies them via `chart.config()`, and redraws with the last dataset. Bars smoothly animate to their new positions.
4. **AxisChart and BarsChart** receive updated scales via `config()` and re-render automatically as part of the `drawAttachments` lifecycle step.

This pattern keeps the chart class reusable: it doesn't depend on `window`, `ResizeObserver`, or any specific container. The responsive behavior is composed via a plugin.
