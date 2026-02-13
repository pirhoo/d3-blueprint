# Lollipop Chart

Horizontal lollipops with thin lines and dots at the tip. Uses a reusable [AxisChart](./reusable-components.md) with `gridAxis: 'x'` for vertical grid lines and two layers (stems + dots) to build each lollipop.

## Live Preview

<ClientOnly>
  <LollipopDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { AxisChart } from './charts/AxisChart.js';
import { Tooltip } from './charts/Tooltip.js';

const MARGIN = { top: 10, right: 20, bottom: 30, left: 100 };

class LollipopChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleBand().padding(0.4);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.axes = new AxisChart(this.chart);
    this.attach('axes', this.axes);

    // Layer 1: stems (lines from zero to value)
    const stemsGroup = this.chart.append('g').attr('class', 'stems');

    this.layer('stems', stemsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('line').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('line'),
      events: {
        enter: (selection) => {
          selection
            .attr('x1', 0)
            .attr('x2', 0)
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
            .attr('y1', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('y2', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('x2', (d) => this.xScale(d.value));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('x2', 0).remove();
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
            .attr('cx', 0)
            .attr('cy', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('r', 5)
            .attr('fill', 'steelblue');
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('cx', (d) => this.xScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('cx', (d) => this.xScale(d.value))
            .attr('cy', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 380 - MARGIN.top - MARGIN.bottom;
    this.tooltip = new Tooltip(this.chart);
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 380 - MARGIN.top - MARGIN.bottom;

    this.yScale.domain(data.map((d) => d.label)).range([0, innerHeight]);
    this.xScale.domain([0, max(data, (d) => d.value) * 1.1]).range([0, innerWidth]).nice();

    this.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 600,
      gridAxis: 'x',
      xTickCount: 6,
    });
  }

  postDraw() {
    const tooltip = this.tooltip;
    const xScale = this.xScale;
    const yScale = this.yScale;

    this.chart.selectAll('.dots circle')
      .on('mouseenter', function (event, d) {
        select(this).attr('r', 7);
        tooltip.show(
          xScale(d.value),
          yScale(d.label) + yScale.bandwidth() / 2,
          `${d.label}: ${d.value}`,
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

const chart = new LollipopChart(
  select('#chart').append('svg').attr('width', 600).attr('height', 380),
);

await chart.draw([
  { label: 'Norway', value: 82 },
  { label: 'Switzerland', value: 80 },
  { label: 'Australia', value: 78 },
  { label: 'Ireland', value: 76 },
  { label: 'Germany', value: 74 },
  { label: 'Iceland', value: 72 },
  { label: 'Sweden', value: 70 },
  { label: 'Singapore', value: 68 },
]);
```

## Key Takeaways

- **Two-layer pattern**: stems (lines) and dots (circles) are separate layers. Both bind the same data and share the same scales, but render different SVG elements.
- **Horizontal layout with `scaleBand` on y**: just like the horizontal bar chart, `scaleBand` on the y-axis creates a horizontal layout with category labels on the left.
- **Dots provide the hover target**: the circle at the tip is the interactive element. On hover it grows slightly and shows the tooltip.
- **`gridAxis: 'x'`**: vertical grid lines complement the horizontal layout, making it easy to read values along the x-axis.
- **Higher padding on `scaleBand`**: `padding(0.4)` creates more space between lollipops than bars would typically use, keeping the chart clean and readable.
