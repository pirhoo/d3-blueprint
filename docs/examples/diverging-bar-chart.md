# Diverging Bar Chart

Bars extending left and right from a zero baseline to show positive and negative values. Uses a reusable [AxisChart](./reusable-components.md) with `gridAxis: 'x'` and color-codes bars by sign: green for positive, red for negative.

## Live Preview

<ClientOnly>
  <DivergingBarDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { min, max } from 'd3-array';
import { AxisChart } from './charts/AxisChart.js';
import { Tooltip } from './plugins/Tooltip.js';

const MARGIN = { top: 10, right: 20, bottom: 30, left: 100 };

class DivergingBarChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleBand().padding(0.2);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    const barsGroup = this.chart.append('g').attr('class', 'bars');

    this.layer('bars', barsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('rect').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('rect'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(Math.min(0, d.value)))
            .attr('y', (d) => this.yScale(d.label))
            .attr('width', 0)
            .attr('height', this.yScale.bandwidth())
            .attr('fill', (d) => d.value >= 0 ? '#50a060' : '#e45858')
            .attr('rx', 2);
        },
        'enter:transition': (transition) => {
          transition
            .duration(600)
            .attr('width', (d) => Math.abs(this.xScale(d.value) - this.xScale(0)));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x', (d) => this.xScale(Math.min(0, d.value)))
            .attr('y', (d) => this.yScale(d.label))
            .attr('width', (d) => Math.abs(this.xScale(d.value) - this.xScale(0)))
            .attr('height', this.yScale.bandwidth())
            .attr('fill', (d) => d.value >= 0 ? '#50a060' : '#e45858');
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('width', 0).remove();
        },
      },
    });

    // Zero reference line
    this.zeroLine = this.chart
      .append('line')
      .attr('class', 'zero-line')
      .attr('stroke', '#666')
      .attr('stroke-width', 1);

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 380 - MARGIN.top - MARGIN.bottom;
    this.tooltip = new Tooltip(this.chart);
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 380 - MARGIN.top - MARGIN.bottom;

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

    this.chart.selectAll('.bars rect')
      .on('mouseenter', function (event, d) {
        select(this).attr('fill-opacity', 0.8);
        const sign = d.value >= 0 ? '+' : '';
        tooltip.show(
          xScale(d.value),
          yScale(d.label) + yScale.bandwidth() / 2,
          `${d.label}: ${sign}${d.value}%`,
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

const chart = new DivergingBarChart(
  select('#chart').append('svg').attr('width', 600).attr('height', 380),
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

- **Bars positioned with `Math.min(0, value)`**: positive bars start at zero and extend right; negative bars start at their value (left of zero) and extend right to zero.
- **Width is the absolute distance from zero**: `Math.abs(xScale(value) - xScale(0))` ensures bars always have positive width regardless of sign.
- **Colors encode sign**: green (`#50a060`) for positive values, red (`#e45858`) for negative. The color updates on `merge:transition` so it animates when a value changes sign.
- **Zero line as a reference**: a thin vertical line at `xScale(0)` anchors the visual comparison. It is a plain SVG element, not a layer.
- **Symmetric domain**: `[-extent, extent]` centers the zero line, ensuring equal visual weight for positive and negative bars.
