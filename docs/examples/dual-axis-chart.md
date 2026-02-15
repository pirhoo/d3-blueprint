# Dual-Axis Bar + Line

Combines bars on a left y-axis with a line on a right y-axis. The same `AxisChart` handles the primary axes while a manual right axis provides the secondary scale — demonstrating how d3-blueprint's `attach()` pattern composes with custom axis logic.

## Live Preview

<ClientOnly>
  <DualAxisChartDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { line } from 'd3-shape';
import { axisRight } from 'd3-axis';
import { AxisChart } from './charts/AxisChart.js';
import { BarsChart } from './charts/BarsChart.js';

const MARGIN = { top: 20, right: 50, bottom: 30, left: 50 };

class DualAxisChart extends D3Blueprint {
  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Left y-axis + x-axis via reusable AxisChart
    this.attach('axes', AxisChart, this.chart);

    // Manual right y-axis group
    this.rightAxisGroup = this.chart.append('g').attr('class', 'right-axis');

    // Reusable bars attachment (reads left scale)
    this.attach('bars', BarsChart, this.chart.append('g').classed('bars', true));

    this.lineFn = line();

    // Inline line layer on top of bars
    const lineGroup = this.chart.append('g').attr('class', 'combo-line');
    this.layer('line', lineGroup, {
      dataBind: (sel, data) => sel.selectAll('path').data([data]),
      insert: (sel) => sel.append('path'),
      events: {
        enter: (sel) => {
          sel.attr('fill', 'none')
            .attr('stroke', '#e45858')
            .attr('stroke-width', 2.5)
            .attr('d', (d) => this.lineFn(d));
        },
        'merge:transition': (t) => t.duration(750).attr('d', (d) => this.lineFn(d)),
      },
    });

    // Dots for the line
    const dotsGroup = this.chart.append('g').attr('class', 'line-dots');
    this.layer('line-dots', dotsGroup, {
      dataBind: (sel, data) => sel.selectAll('circle').data(data, (d) => d.label),
      insert: (sel) => sel.append('circle'),
      events: {
        enter: (sel) => {
          sel.attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.yRight(d.growth))
            .attr('r', 0).attr('fill', '#e45858');
        },
        'enter:transition': (t) => t.duration(400).attr('r', 3),
        'merge:transition': (t) => {
          t.duration(750)
            .attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.yRight(d.growth));
        },
        'exit:transition': (t) => t.duration(200).attr('r', 0).remove(),
      },
    });
  }

  preDraw(data) {
    const innerWidth = 500 - MARGIN.left - MARGIN.right;
    const innerHeight = 320 - MARGIN.top - MARGIN.bottom;

    this.xScale = scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    this.yLeft = scaleLinear()
      .domain([0, (max(data, (d) => d.value) ?? 0) * 1.1])
      .range([innerHeight, 0]);

    this.yRight = scaleLinear()
      .domain([0, (max(data, (d) => d.growth) ?? 0) * 1.2])
      .range([innerHeight, 0]);

    this.lineFn
      .x((d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
      .y((d) => this.yRight(d.growth));

    this.attached.axes.config({
      xScale: this.xScale, yScale: this.yLeft,
      innerWidth, innerHeight, duration: 750, yTickCount: 5,
    });

    // Manual right axis
    const rightAxis = axisRight(this.yRight).ticks(5).tickSize(0).tickPadding(10);
    this.rightAxisGroup
      .attr('transform', `translate(${innerWidth},0)`)
      .transition().duration(750).call(rightAxis);
    this.rightAxisGroup.select('.domain').remove();

    this.attached.bars.config({
      xScale: this.xScale, yScale: this.yLeft,
      innerHeight, fill: 'steelblue', duration: 750,
    });
  }
}
```

## Usage

```js
chart.draw([
  { label: 'Q1', value: 120, growth: 12 },
  { label: 'Q2', value: 180, growth: 18 },
  { label: 'Q3', value: 150, growth: 8 },
  { label: 'Q4', value: 220, growth: 25 },
]);
```

## Key Takeaways

- **Dual scales** — `AxisChart` handles the left y-axis and x-axis; a manual `axisRight` call adds the secondary scale.
- `BarsChart` reads from the left scale while the line layer reads from the right scale — same x-axis, different y-axes.
- The `attach()` pattern lets you combine reusable components (`BarsChart`) with custom inline layers in one blueprint.
