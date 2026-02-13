# Bar Chart Example

A complete, annotated bar chart built with d3-blueprint. This example composes an `AxisChart` and a `BarsChart` via `attach()`. See [Reusable Components](./reusable-components.md) for the full source of those building blocks.

## Live Preview

<ClientOnly>
  <BarChartDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { AxisChart } from './charts/AxisChart.js';
import { BarsChart } from './charts/BarsChart.js';
import { Tooltip } from './charts/Tooltip.js';

const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };

class BarChart extends D3Blueprint {
  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Attach reusable axis and bar components
    this.axes = new AxisChart(this.chart);
    this.attach('axes', this.axes);

    this.bars = new BarsChart(this.chart.append('g').classed('bars', true));
    this.attach('bars', this.bars);

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;
    this.tooltip = new Tooltip(this.chart);
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    this.xScale = scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.1);

    this.yScale = scaleLinear()
      .domain([0, max(data, (d) => d.value) ?? 0])
      .range([innerHeight, 0]);

    // Configure attachments. They read these when they draw.
    this.axes.config({ xScale: this.xScale, yScale: this.yScale, innerWidth, innerHeight, duration: 750 });
    this.bars.config({ xScale: this.xScale, yScale: this.yScale, innerHeight, fill: 'steelblue', duration: 750 });
  }

  postDraw() {
    const tooltip = this.tooltip;
    const xScale = this.xScale;
    const yScale = this.yScale;

    this.bars.base.selectAll('rect')
      .on('mouseenter', function (event, d) {
        select(this).attr('opacity', 0.8);
        tooltip.show(xScale(d.label) + xScale.bandwidth(), yScale(d.value), `${d.label}: ${d.value}`);
      })
      .on('mouseleave', function () {
        select(this).attr('opacity', 1);
        tooltip.hide();
      });
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new BarChart(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

await chart.draw([
  { label: 'A', value: 30 },
  { label: 'B', value: 86 },
  { label: 'C', value: 168 },
  { label: 'D', value: 47 },
]);

// Update with new data. Bars animate to new positions.
await chart.draw([
  { label: 'A', value: 80 },
  { label: 'B', value: 50 },
  { label: 'C', value: 120 },
  { label: 'D', value: 200 },
  { label: 'E', value: 65 },
]);
```

## Key Takeaways

- **`attach()`** wires reusable components into the parent's draw lifecycle, so no manual orchestration is needed.
- **`preDraw()`** computes scales and passes them to attachments via `config()`. The attachments read these configs when they draw.
- **AxisChart** handles all axis rendering (ticks, transitions, tick counts) from configured scales.
- **BarsChart** handles the enter/update/exit data-join for bars, reading scales and styling from config.
- **The parent chart has zero layers**. It only computes data and delegates rendering to attachments.
- **`postDraw()`** attaches mouse event handlers for the tooltip. Since d3-blueprint layers only support lifecycle events (enter/update/exit), DOM mouse events are wired via D3's `.on()` in `postDraw()`.
