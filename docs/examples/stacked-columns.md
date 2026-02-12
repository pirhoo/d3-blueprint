# Stacked Columns Chart

A stacked column chart using `d3-shape`'s `stack()` layout. Each category is split into segments that represent sub-values, and a legend layer labels the colors. Axes are handled by a reusable [AxisChart](./reusable-components.md) attachment.

## Live Preview

<ClientOnly>
  <StackedColumnsDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';
import { max } from 'd3-array';
import { stack } from 'd3-shape';
import { select } from 'd3-selection';
import { AxisChart } from './charts/AxisChart.js';
import { Tooltip } from './charts/Tooltip.js';

const COLORS = ['steelblue', '#e45858', '#50a060'];
const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };

class StackedColumnsChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleBand().padding(0.2);
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().range(COLORS);
    this.stacked = [];

    this.configDefine('keys', { defaultValue: [] });

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Reusable axis component
    this.axes = new AxisChart(this.chart);
    this.attach('axes', this.axes);

    // Layer 1: one <g> per series
    const stackGroup = this.chart.append('g').attr('class', 'stacks');

    this.layer('stacks', stackGroup, {
      // Read from this.stacked (computed in preDraw), not the raw data
      dataBind: (selection) => {
        return selection.selectAll('g.series').data(this.stacked, (d) => d.key);
      },
      insert: (selection) => {
        return selection.append('g').attr('class', 'series');
      },
      events: {
        merge: (selection) => {
          selection.attr('fill', (d) => this.colorScale(d.key));
          this._drawRects(selection);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer 2: legend
    const legendGroup = this.chart.append('g').attr('class', 'legend');

    this.layer('legend', legendGroup, {
      dataBind: (selection) => {
        return selection.selectAll('g.legend-item').data(this.config('keys'));
      },
      insert: (selection) => {
        const g = selection.append('g').attr('class', 'legend-item');
        g.append('rect');
        g.append('text');
        return g;
      },
      events: {
        merge: (selection) => {
          selection.attr('transform', (d, i) => `translate(${i * 90}, ${-10})`);
          selection.select('rect')
            .attr('width', 12).attr('height', 12).attr('rx', 2)
            .attr('fill', (d) => this.colorScale(d));
          selection.select('text')
            .attr('x', 16).attr('y', 6).attr('dy', '0.35em')
            .attr('font-size', '11px')
            .text((d) => d);
        },
      },
    });

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;
    this.tooltip = new Tooltip(this.chart, { width: innerWidth, height: innerHeight });
  }

  // Nested rects inside each series group, managed outside layers
  _drawRects(seriesSelection) {
    const self = this;
    seriesSelection.each(function () {
      const group = select(this);
      const rects = group.selectAll('rect').data((d) => d);

      rects.enter()
        .append('rect')
        .attr('x', (d) => self.xScale(d.data.label))
        .attr('width', self.xScale.bandwidth())
        .attr('y', self.innerHeight)
        .attr('height', 0)
        .attr('rx', 1)
        .transition().duration(600)
        .attr('y', (d) => self.yScale(d[1]))
        .attr('height', (d) => self.yScale(d[0]) - self.yScale(d[1]));

      rects.transition().duration(600)
        .attr('x', (d) => self.xScale(d.data.label))
        .attr('width', self.xScale.bandwidth())
        .attr('y', (d) => self.yScale(d[1]))
        .attr('height', (d) => self.yScale(d[0]) - self.yScale(d[1]));

      rects.exit().transition().duration(200).attr('opacity', 0).remove();
    });
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    this.innerHeight = 400 - MARGIN.top - MARGIN.bottom;
    const keys = this.config('keys');

    this.colorScale.domain(keys);

    // Compute the stacked layout and store for dataBind to read
    this.stacked = stack().keys(keys)(data);
    const maxVal = max(this.stacked[this.stacked.length - 1], (d) => d[1]);

    this.xScale.domain(data.map((d) => d.label)).range([0, innerWidth]);
    this.yScale.domain([0, maxVal]).range([this.innerHeight, 0]).nice();

    this.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight: this.innerHeight,
      duration: 600,
    });
  }

  postDraw() {
    const tooltip = this.tooltip;
    const xScale = this.xScale;
    const yScale = this.yScale;

    this.chart.selectAll('.stacks rect')
      .on('mouseenter', function (event, d) {
        const key = select(this.parentNode).datum().key;
        const value = d[1] - d[0];
        select(this).attr('opacity', 0.8);
        tooltip.show(
          xScale(d.data.label) + xScale.bandwidth(),
          yScale(d[1]),
          `${key}: ${value}`,
        );
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

const chart = new StackedColumnsChart(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

chart.config('keys', ['mobile', 'desktop', 'tablet']);

await chart.draw([
  { label: 'Q1', mobile: 40, desktop: 80, tablet: 20 },
  { label: 'Q2', mobile: 60, desktop: 70, tablet: 30 },
  { label: 'Q3', mobile: 90, desktop: 60, tablet: 45 },
  { label: 'Q4', mobile: 70, desktop: 90, tablet: 35 },
]);
```

## Key Takeaways

- **AxisChart handles axis rendering**: the parent configures it with scales in `preDraw()`, eliminating boilerplate.
- **`preDraw()` computes the stacked layout**: `d3-shape`'s `stack()` transforms flat rows into nested arrays of `[y0, y1]` pairs. The result is stored on `this.stacked` for the layer to read.
- **`dataBind` reads `this.stacked`**: since `preDraw()` returns `void`, the layer ignores the raw data argument and reads from the instance property instead.
- **Nested rects**: the `stacks` layer manages one `<g>` per series. Inside each group, `_drawRects()` runs a standard D3 data-join for the individual rectangles.
- **Legend layer**: reads `this.config('keys')` directly, ignoring the chart data entirely.
- **Config for keys**: `configDefine('keys')` lets the caller set which columns to stack without subclassing.
