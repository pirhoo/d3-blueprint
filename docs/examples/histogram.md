# Histogram

A frequency histogram using `d3-array`'s `bin()` to bucket continuous values. Uses a reusable [AxisChart](./reusable-components.md) for axes and `transform()` to preprocess raw values into bins before the layers see the data.

## Live Preview

<ClientOnly>
  <HistogramDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { max, bin } from 'd3-array';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from './plugins/Tooltip.js';

const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };

class Histogram extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    // Bars layer. Each bar is one bin.
    const barsGroup = this.chart.append('g').attr('class', 'bars');

    this.layer('bars', barsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('rect').data(data, (d) => d.x0);
      },
      insert: (selection) => selection.append('rect'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(d.x0) + 1)
            .attr('width', (d) => Math.max(0, this.xScale(d.x1) - this.xScale(d.x0) - 2))
            .attr('y', innerHeight)
            .attr('height', 0)
            .attr('fill', 'steelblue')
            .attr('rx', 1);
        },
        'enter:transition': (transition) => {
          transition
            .duration(600)
            .attr('y', (d) => this.yScale(d.length))
            .attr('height', (d) => innerHeight - this.yScale(d.length));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x', (d) => this.xScale(d.x0) + 1)
            .attr('width', (d) => Math.max(0, this.xScale(d.x1) - this.xScale(d.x0) - 2))
            .attr('y', (d) => this.yScale(d.length))
            .attr('height', (d) => innerHeight - this.yScale(d.length));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    this.tooltip = tooltipPlugin(this.chart);
  }

  transform(data) {
    this.xScale.domain([0, 100]);
    return bin().domain(this.xScale.domain()).thresholds(20)(data);
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    this.xScale.range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.length)]).range([innerHeight, 0]).nice();

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 600,
      xTickCount: 10,
      yTickCount: 5,
    });
  }

  postDraw(data) {
    const tooltip = this.tooltip;
    const xScale = this.xScale;
    const yScale = this.yScale;

    this.chart.selectAll('.bars rect')
      .on('mouseenter', function (event, d) {
        select(this).attr('fill-opacity', 0.8);
        tooltip.show(
          xScale((d.x0 + d.x1) / 2),
          yScale(d.length),
          `${d.x0}–${d.x1}: ${d.length} values`,
        );
      })
      .on('mouseleave', function () {
        select(this).attr('fill-opacity', 1);
        tooltip.hide();
      });
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new Histogram(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

// Pass raw continuous values. transform() bins them automatically.
const data = Array.from({ length: 500 }, () =>
  Math.round(50 + (Math.random() + Math.random() + Math.random() - 1.5) * 30),
);

await chart.draw(data);
```

## Key Takeaways

- **`transform()` preprocesses raw data**: the raw array of numbers is converted into bins before `preDraw()` and the layers see it. This keeps the layer logic clean, since it only deals with bin objects.
- **`bin().domain().thresholds()`**: D3's `bin()` generator controls how values are bucketed. `domain([0, 100])` sets the range, `thresholds(20)` creates ~20 evenly spaced bins.
- **Bins have `x0`, `x1`, and `length`**: each bin is an array of values with `x0` (lower bound) and `x1` (upper bound) properties. `d.length` gives the count.
- **AxisChart handles axis rendering**: the parent configures it with scales in `preDraw()`.
- **Bar width comes from the bin boundaries**: `xScale(d.x1) - xScale(d.x0)` ensures bars fill their bin exactly, with a small gap between them.
