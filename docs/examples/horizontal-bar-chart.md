# Horizontal Bar Chart

Horizontal bars with category labels on the y-axis. Uses a reusable [AxisChart](./reusable-components.md) with `gridAxis: 'x'` to draw vertical grid lines instead of the default horizontal ones.

## Live Preview

<ClientOnly>
  <HorizontalBarChartDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from './plugins/Tooltip.js';

const MARGIN = { top: 10, right: 20, bottom: 30, left: 100 };

class HorizontalBarChart extends D3Blueprint {
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
            .attr('x', 0)
            .attr('y', (d) => this.yScale(d.label))
            .attr('width', 0)
            .attr('height', this.yScale.bandwidth())
            .attr('fill', 'steelblue')
            .attr('rx', 2);
        },
        'enter:transition': (transition) => {
          transition
            .duration(600)
            .attr('width', (d) => this.xScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('y', (d) => this.yScale(d.label))
            .attr('width', (d) => this.xScale(d.value))
            .attr('height', this.yScale.bandwidth());
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('width', 0).remove();
        },
      },
    });

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 380 - MARGIN.top - MARGIN.bottom;
    this.tooltip = tooltipPlugin(this.chart);
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 380 - MARGIN.top - MARGIN.bottom;

    this.yScale.domain(data.map((d) => d.label)).range([0, innerHeight]);
    this.xScale.domain([0, max(data, (d) => d.value) * 1.1]).range([0, innerWidth]).nice();

    this.attached.axes.config({
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

    this.chart.selectAll('.bars rect')
      .on('mouseenter', function (event, d) {
        select(this).attr('fill-opacity', 0.8);
        tooltip.show(
          xScale(d.value),
          yScale(d.label) + yScale.bandwidth() / 2,
          `${d.label}: ${d.value}`,
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

const chart = new HorizontalBarChart(
  select('#chart').append('svg').attr('width', 600).attr('height', 380),
);

await chart.draw([
  { label: 'JavaScript', value: 65 },
  { label: 'Python', value: 50 },
  { label: 'TypeScript', value: 39 },
  { label: 'Java', value: 35 },
  { label: 'C#', value: 28 },
  { label: 'C++', value: 23 },
  { label: 'Go', value: 14 },
  { label: 'Rust', value: 12 },
]);
```

## Key Takeaways

- **`scaleBand` on the y-axis**: flipping the band scale to the y-axis creates a horizontal layout. Categories appear as row labels on the left.
- **`gridAxis: 'x'`**: switches AxisChart's grid lines from horizontal (default `'y'`) to vertical, which makes more sense for horizontal bars.
- **Bars grow from the left**: enter animation starts with `width: 0` and transitions to the final width, creating a left-to-right reveal.
- **Left margin is wider**: `MARGIN.left: 100` provides room for category labels that are longer than typical tick values.
- **AxisChart handles both axes**: even with the flipped layout, the same reusable AxisChart works. It just receives a `scaleBand` for y instead of x.
