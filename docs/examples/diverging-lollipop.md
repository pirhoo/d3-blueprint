# Diverging Lollipop

Swaps diverging bars for lollipop stems and dots — the same axis setup, scale logic, and zero-line from the Diverging Bar Chart, but with a different visual encoding. Demonstrates how changing the visual layer while keeping the same infrastructure is trivial with d3-blueprint.

## Live Preview

<ClientOnly>
  <DivergingLollipopDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { min, max } from 'd3-array';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from './plugins/Tooltip.js';

const MARGIN = { top: 10, right: 20, bottom: 30, left: 100 };

class DivergingLollipop extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleBand().padding(0.4);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Layer 1: stems (horizontal lines from zero to value)
    const stemsGroup = this.chart.append('g').attr('class', 'stems');

    this.layer('stems', stemsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('line').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('line'),
      events: {
        enter: (selection) => {
          selection
            .attr('x1', this.xScale(0))
            .attr('x2', this.xScale(0))
            .attr('y1', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('y2', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('stroke', '#999')
            .attr('stroke-width', 1.5);
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('x2', (d) => this.xScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x1', this.xScale(0))
            .attr('x2', (d) => this.xScale(d.value))
            .attr('y1', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('y2', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('x2', this.xScale(0)).remove();
        },
      },
    });

    // Layer 2: dots at the tip
    const dotsGroup = this.chart.append('g').attr('class', 'dots');

    this.layer('dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', this.xScale(0))
            .attr('cy', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('r', 5)
            .attr('fill', (d) => d.value >= 0 ? '#50a060' : '#e45858');
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('cx', (d) => this.xScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('cx', (d) => this.xScale(d.value))
            .attr('cy', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('fill', (d) => d.value >= 0 ? '#50a060' : '#e45858');
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Zero line (persistent element, not a layer)
    this.zeroLine = this.chart
      .append('line')
      .attr('class', 'zero-line')
      .attr('stroke', '#666')
      .attr('stroke-width', 1);

    const innerWidth = 500 - MARGIN.left - MARGIN.right;
    const innerHeight = 360 - MARGIN.top - MARGIN.bottom;
    this.tooltip = tooltipPlugin(this.chart);
  }

  preDraw(data) {
    const innerWidth = 500 - MARGIN.left - MARGIN.right;
    const innerHeight = 360 - MARGIN.top - MARGIN.bottom;

    const lo = min(data, (d) => d.value);
    const hi = max(data, (d) => d.value);
    const extent = Math.max(Math.abs(lo), Math.abs(hi));

    this.yScale.domain(data.map((d) => d.label)).range([0, innerHeight]);
    this.xScale.domain([-extent * 1.1, extent * 1.1]).range([0, innerWidth]).nice();

    this.zeroLine
      .attr('x1', this.xScale(0))
      .attr('x2', this.xScale(0))
      .attr('y1', 0)
      .attr('y2', innerHeight);

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 600,
      gridAxis: 'x',
      xTickCount: 8,
    });
  }

  postDraw() {
    const tooltip = this.tooltip;
    const xScale = this.xScale;
    const yScale = this.yScale;

    this.chart.selectAll('.dots circle')
      .on('mouseenter', function (event, d) {
        select(this).attr('r', 7);
        const sign = d.value >= 0 ? '+' : '';
        tooltip.show(
          xScale(d.value),
          yScale(d.label) + yScale.bandwidth() / 2,
          `${d.label}: ${sign}${d.value}%`,
        );
      })
      .on('mouseleave', function () {
        select(this).attr('r', 5);
        tooltip.hide();
      });
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new DivergingLollipop(
  select('#chart').append('svg').attr('width', 500).attr('height', 360),
);

await chart.draw([
  { label: 'Energy', value: 12 },
  { label: 'Tech', value: 24 },
  { label: 'Healthcare', value: 8 },
  { label: 'Finance', value: -5 },
  { label: 'Real Estate', value: -18 },
  { label: 'Consumer', value: 3 },
  { label: 'Utilities', value: -8 },
  { label: 'Materials', value: 15 },
]);
```

## Key Takeaways

- **Same axes, different encoding** — the `AxisChart` config and diverging scale logic are identical to the Diverging Bar Chart; only the visual layers change
- **Color encodes sign** — green (`#50a060`) for positive, red (`#e45858`) for negative on both the dots and conceptually in the stems
- **The zero-line is a simple persistent element outside the layer system** — not everything needs to be a managed layer
