# Grouped Bar Chart

Uses a nested `scaleBand` to position grouped bars side-by-side within each category. A color-coded legend and tooltip make each series easy to identify — all built from a single `D3Blueprint` with inline layers and `AxisChart`.

## Live Preview

<ClientOnly>
  <GroupedBarChartDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';
import { max } from 'd3-array';
import { select } from 'd3-selection';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from './plugins/Tooltip.js';

const COLORS = ['steelblue', '#e45858', '#50a060'];
const KEYS = ['mobile', 'desktop', 'tablet'];
const MARGIN = { top: 30, right: 20, bottom: 30, left: 40 };

class GroupedBarChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleBand().padding(0.2);
    this.x1Scale = scaleBand().padding(0.05);
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().domain(KEYS).range(COLORS);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Reusable axis component
    this.attach('axes', AxisChart, this.chart);

    // Layer 1: grouped bars
    const barsGroup = this.chart.append('g').attr('class', 'bars');

    this.layer('bars', barsGroup, {
      dataBind: (selection, data) => {
        const flat = [];
        data.forEach((d) => {
          KEYS.forEach((key) => {
            flat.push({ label: d.label, key, value: d[key] });
          });
        });
        return selection.selectAll('rect').data(flat, (d) => `${d.label}-${d.key}`);
      },
      insert: (selection) => selection.append('rect'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(d.label) + this.x1Scale(d.key))
            .attr('width', this.x1Scale.bandwidth())
            .attr('y', this.innerHeight)
            .attr('height', 0)
            .attr('rx', 1)
            .attr('fill', (d) => this.colorScale(d.key));
        },
        'enter:transition': (transition) => {
          transition
            .duration(600)
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => this.innerHeight - this.yScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x', (d) => this.xScale(d.label) + this.x1Scale(d.key))
            .attr('width', this.x1Scale.bandwidth())
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => this.innerHeight - this.yScale(d.value))
            .attr('fill', (d) => this.colorScale(d.key));
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
        return selection.selectAll('g.legend-item').data(KEYS);
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
    this.tooltip = tooltipPlugin(this.chart);
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    this.innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    this.xScale.domain(data.map((d) => d.label)).range([0, innerWidth]);
    this.x1Scale.domain(KEYS).range([0, this.xScale.bandwidth()]);

    const maxVal = max(data, (d) => max(KEYS, (key) => d[key])) ?? 0;
    this.yScale.domain([0, maxVal]).range([this.innerHeight, 0]).nice();

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
    const x1Scale = this.x1Scale;
    const yScale = this.yScale;

    this.chart.selectAll('.bars rect')
      .on('mouseenter', function (event, d) {
        select(this).attr('opacity', 0.8);
        tooltip.show(
          xScale(d.label) + x1Scale(d.key) + x1Scale.bandwidth(),
          yScale(d.value),
          `${d.key}: ${d.value}`,
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

const chart = new GroupedBarChart(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

await chart.draw([
  { label: 'Q1', mobile: 40, desktop: 80, tablet: 20 },
  { label: 'Q2', mobile: 60, desktop: 70, tablet: 30 },
  { label: 'Q3', mobile: 90, desktop: 60, tablet: 45 },
  { label: 'Q4', mobile: 70, desktop: 90, tablet: 35 },
]);
```

## Key Takeaways

- **Nested `scaleBand`** — an inner band scale subdivides each category into per-group slots, positioning bars side-by-side without manual offset math.
- **`scaleOrdinal` maps group keys to colors** — reused by both bars and the legend layer for consistent color coding.
- **`AxisChart` is attached once and handles both axes** — the grouped bars are just another layer on top, keeping axis logic fully decoupled.
