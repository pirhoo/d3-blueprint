# Stacked Bars + Line

Composes stacked columns with a trend line in a single blueprint — two distinct visualization families sharing the same `AxisChart` and x-axis. Demonstrates how `stack()` layers and line layers coexist seamlessly.

## Live Preview

<ClientOnly>
  <StackedBarLineDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';
import { max } from 'd3-array';
import { stack, line } from 'd3-shape';
import { select } from 'd3-selection';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from './plugins/Tooltip.js';

const COLORS = ['steelblue', '#e45858', '#50a060'];
const KEYS = ['mobile', 'desktop', 'tablet'];
const MARGIN = { top: 30, right: 20, bottom: 30, left: 40 };

class StackedBarLine extends D3Blueprint {
  initialize() {
    this.xScale = scaleBand().padding(0.2);
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().domain(KEYS).range(COLORS);
    this.stacked = [];
    this.lineFn = line();

    this.configDefine('keys', { defaultValue: [] });

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Reusable axis component
    this.attach('axes', AxisChart, this.chart);

    // Layer 1: stacked bars
    const stackGroup = this.chart.append('g').attr('class', 'stacks');

    this.layer('stacks', stackGroup, {
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

    // Layer 2: trend line path
    const lineGroup = this.chart.append('g').attr('class', 'trend-line');

    this.layer('line', lineGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('path').data([data]);
      },
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'none')
            .attr('stroke', 'orange')
            .attr('stroke-width', 2.5)
            .attr('d', (d) => this.lineFn(d));
        },
        'merge:transition': (transition) => {
          transition.duration(600).attr('d', (d) => this.lineFn(d));
        },
      },
    });

    // Layer 3: trend line dots
    const dotsGroup = this.chart.append('g').attr('class', 'line-dots');

    this.layer('line-dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.yScale(d.trend))
            .attr('r', 0)
            .attr('fill', 'orange');
        },
        'enter:transition': (transition) => {
          transition.duration(400).attr('r', 3);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.yScale(d.trend));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Layer 4: legend (includes stacked series + trend)
    const legendItems = [...KEYS, 'trend'];
    const legendGroup = this.chart.append('g').attr('class', 'legend');

    this.layer('legend', legendGroup, {
      dataBind: (selection) => {
        return selection.selectAll('g.legend-item').data(legendItems);
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
            .attr('fill', (d) =>
              d === 'trend' ? 'orange' : this.colorScale(d));
          selection.select('text')
            .attr('x', 16).attr('y', 6).attr('dy', '0.35em')
            .attr('font-size', '11px')
            .text((d) => d);
        },
      },
    });

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;
    this.tooltip = tooltipPlugin(this.chart);
  }

  // Nested rects inside each series group
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

    this.stacked = stack().keys(keys)(data);
    const stackMax = max(this.stacked[this.stacked.length - 1], (d) => d[1]);
    const trendMax = max(data, (d) => d.trend);
    const maxVal = max([stackMax, trendMax]);

    this.xScale.domain(data.map((d) => d.label)).range([0, innerWidth]);
    this.yScale.domain([0, maxVal]).range([this.innerHeight, 0]).nice();

    this.lineFn
      .x((d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
      .y((d) => this.yScale(d.trend));

    this.attached.axes.config({
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

    this.chart.selectAll('.line-dots circle')
      .on('mouseenter', function (event, d) {
        select(this).attr('r', 5);
        tooltip.show(
          xScale(d.label) + xScale.bandwidth() / 2,
          yScale(d.trend),
          `trend: ${d.trend}`,
        );
      })
      .on('mouseleave', function () {
        select(this).attr('r', 3);
        tooltip.hide();
      });
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new StackedBarLine(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

chart.config('keys', ['mobile', 'desktop', 'tablet']);

await chart.draw([
  { label: 'Q1', mobile: 40, desktop: 80, tablet: 20, trend: 120 },
  { label: 'Q2', mobile: 60, desktop: 70, tablet: 30, trend: 140 },
  { label: 'Q3', mobile: 90, desktop: 60, tablet: 45, trend: 165 },
  { label: 'Q4', mobile: 70, desktop: 90, tablet: 35, trend: 175 },
]);
```

## Key Takeaways

- **Stack + Line composition** — `d3-shape`'s `stack()` feeds the bar layers while a `line()` generator draws the trend, all sharing one `AxisChart`.
- **The legend layer includes both stacked series and the trend line** — a single layer handles heterogeneous items by checking the key name for color assignment.
- **One `draw()` call updates both stacked bars and the line simultaneously** — `preDraw()` computes a unified y-domain that accommodates both the stacked max and the trend max.
