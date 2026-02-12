# Slope Chart

A slope chart comparing before/after values with connecting lines. No AxisChart is needed because this chart uses `scalePoint` for the two discrete columns and manages its own layout with four layers: connecting lines, left dots, right dots, and labels.

## Live Preview

<ClientOnly>
  <SlopeChartDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear, scalePoint, scaleOrdinal } from 'd3-scale';
import { min, max } from 'd3-array';
import { Tooltip } from './charts/Tooltip.js';

const COLORS = ['steelblue', '#e45858', '#50a060', '#e8a838', '#7c6bbf'];
const MARGIN = { top: 30, right: 60, bottom: 30, left: 60 };

class SlopeChart extends D3Blueprint {
  initialize() {
    this.xScale = scalePoint();
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().range(COLORS);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const innerWidth = 400 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    // Layer 1: connecting lines
    const linesGroup = this.chart.append('g').attr('class', 'lines');

    this.layer('lines', linesGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('line').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('line'),
      events: {
        enter: (selection) => {
          selection
            .attr('x1', this.xScale('Before'))
            .attr('x2', this.xScale('After'))
            .attr('y1', (d) => this.yScale(d.before))
            .attr('y2', (d) => this.yScale(d.after))
            .attr('stroke', (d) => this.colorScale(d.label))
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0);
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('stroke-opacity', 0.8);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('stroke-opacity', 0.8)
            .attr('y1', (d) => this.yScale(d.before))
            .attr('y2', (d) => this.yScale(d.after))
            .attr('stroke', (d) => this.colorScale(d.label));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('stroke-opacity', 0).remove();
        },
      },
    });

    // Layer 2: left dots (before values)
    const leftDotsGroup = this.chart.append('g').attr('class', 'left-dots');

    this.layer('left-dots', leftDotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', this.xScale('Before'))
            .attr('cy', (d) => this.yScale(d.before))
            .attr('r', 0)
            .attr('fill', (d) => this.colorScale(d.label));
        },
        'enter:transition': (transition) => {
          transition.duration(400).attr('r', 5);
        },
        'merge:transition': (transition) => {
          transition.duration(600).attr('r', 5).attr('cy', (d) => this.yScale(d.before));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Layer 3: right dots (after values)
    const rightDotsGroup = this.chart.append('g').attr('class', 'right-dots');

    this.layer('right-dots', rightDotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', this.xScale('After'))
            .attr('cy', (d) => this.yScale(d.after))
            .attr('r', 0)
            .attr('fill', (d) => this.colorScale(d.label));
        },
        'enter:transition': (transition) => {
          transition.duration(400).attr('r', 5);
        },
        'merge:transition': (transition) => {
          transition.duration(600).attr('r', 5).attr('cy', (d) => this.yScale(d.after));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Layer 4: labels on the right side
    const labelsGroup = this.chart.append('g').attr('class', 'labels');

    this.layer('labels', labelsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('text').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('text'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', this.xScale('After') + 10)
            .attr('y', (d) => this.yScale(d.after))
            .attr('dy', '0.35em')
            .attr('font-size', '11px')
            .attr('fill', (d) => this.colorScale(d.label))
            .text((d) => d.label);
        },
        'merge:transition': (transition) => {
          transition.duration(600).attr('y', (d) => this.yScale(d.after));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Column headers
    this.chart.append('text')
      .attr('x', 0).attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text('Before');

    this.chart.append('text')
      .attr('x', innerWidth).attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text('After');

    this.tooltip = new Tooltip(this.chart, { width: innerWidth, height: innerHeight });
  }

  preDraw(data) {
    const innerWidth = 400 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    const allValues = data.flatMap((d) => [d.before, d.after]);
    this.xScale.domain(['Before', 'After']).range([0, innerWidth]);
    this.yScale.domain([min(allValues) * 0.9, max(allValues) * 1.1]).range([innerHeight, 0]);
    this.colorScale.domain(data.map((d) => d.label));
  }

  postDraw() {
    const tooltip = this.tooltip;
    const xScale = this.xScale;
    const yScale = this.yScale;

    this.chart.selectAll('.left-dots circle, .right-dots circle')
      .on('mouseenter', function (event, d) {
        select(this).attr('r', 7);
        const isLeft = select(this.parentNode).classed('left-dots');
        const val = isLeft ? d.before : d.after;
        const side = isLeft ? 'Before' : 'After';
        tooltip.show(
          xScale(side),
          yScale(val),
          [{ text: d.label }, { text: `${side}: ${val}` }],
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

const chart = new SlopeChart(
  select('#chart').append('svg').attr('width', 400).attr('height', 400),
);

await chart.draw([
  { label: 'Product A', before: 45, after: 72 },
  { label: 'Product B', before: 60, after: 48 },
  { label: 'Product C', before: 35, after: 65 },
  { label: 'Product D', before: 80, after: 82 },
  { label: 'Product E', before: 55, after: 40 },
]);
```

## Key Takeaways

- **`scalePoint` for discrete columns**: unlike `scaleBand` (which has width), `scalePoint` maps discrete values ("Before", "After") to exact x positions with no bandwidth.
- **Multiple layers for visual elements**: four layers (lines, left-dots, right-dots, labels) all bind the same data array, each rendering a different part of the chart.
- **Right-side labels for identification**: text labels are positioned next to the "After" dots, with the right margin providing space.
- **No AxisChart needed**: slope charts have a custom layout with just two columns and no traditional axes, so the chart manages its own coordinate system.
- **Slope direction encodes change**: upward lines indicate increase, downward lines indicate decrease. Color distinguishes items rather than direction.
