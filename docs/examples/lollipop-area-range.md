# Lollipop + Area Range

A shaded confidence band behind lollipop markers — the area layer and lollipop layers (stems + dots) composed on the same axes. Shows how different visual encodings (area shape + point markers) layer naturally in one blueprint.

## Live Preview

<ClientOnly>
  <LollipopAreaRangeDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { area, curveCatmullRom } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from './plugins/Tooltip.js';

const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };

class LollipopAreaRange extends D3Blueprint {
  initialize() {
    this.xScale = scaleBand().padding(0.2);
    this.yScale = scaleLinear();
    this.areaFn = area().curve(curveCatmullRom);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Layer 1: confidence range area
    const rangeGroup = this.chart.append('g').attr('class', 'range');

    this.layer('range', rangeGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('path').data([data]);
      },
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'steelblue')
            .attr('fill-opacity', 0.12)
            .attr('d', (d) => this.areaFn(d));
        },
        'merge:transition': (transition) => {
          transition.duration(600).attr('d', (d) => this.areaFn(d));
        },
      },
    });

    // Layer 2: stems (vertical lines from baseline to value)
    const stemsGroup = this.chart.append('g').attr('class', 'stems');

    this.layer('stems', stemsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('line').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('line'),
      events: {
        enter: (selection) => {
          selection
            .attr('x1', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('x2', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('y1', this.yScale(0))
            .attr('y2', this.yScale(0))
            .attr('stroke', '#999')
            .attr('stroke-width', 1.5);
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('y2', (d) => this.yScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x1', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('x2', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('y1', this.yScale(0))
            .attr('y2', (d) => this.yScale(d.value));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('y2', this.yScale(0)).remove();
        },
      },
    });

    // Layer 3: dots at the tip
    const dotsGroup = this.chart.append('g').attr('class', 'dots');

    this.layer('dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.yScale(d.value))
            .attr('r', 0)
            .attr('fill', 'steelblue');
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('r', 5);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.yScale(d.value));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    const innerWidth = 500 - MARGIN.left - MARGIN.right;
    const innerHeight = 320 - MARGIN.top - MARGIN.bottom;
    this.tooltip = tooltipPlugin(this.chart);
  }

  preDraw(data) {
    const innerWidth = 500 - MARGIN.left - MARGIN.right;
    const innerHeight = 320 - MARGIN.top - MARGIN.bottom;

    const maxHigh = max(data, (d) => d.high);

    this.xScale.domain(data.map((d) => d.label)).range([0, innerWidth]);
    this.yScale.domain([0, maxHigh * 1.1]).range([innerHeight, 0]);

    this.areaFn
      .x((d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
      .y0((d) => this.yScale(d.low))
      .y1((d) => this.yScale(d.high));

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 600,
      xTickCount: 6,
      yTickCount: 5,
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
          xScale(d.label) + xScale.bandwidth() / 2,
          yScale(d.value),
          `${d.label}: ${d.value} (${d.low}–${d.high})`,
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

const chart = new LollipopAreaRange(
  select('#chart').append('svg').attr('width', 500).attr('height', 320),
);

await chart.draw([
  { label: 'Jan', value: 65, low: 50, high: 80 },
  { label: 'Feb', value: 80, low: 65, high: 95 },
  { label: 'Mar', value: 55, low: 40, high: 70 },
  { label: 'Apr', value: 90, low: 75, high: 105 },
  { label: 'May', value: 70, low: 55, high: 85 },
  { label: 'Jun', value: 100, low: 85, high: 115 },
]);
```

## Key Takeaways

- **Area + Lollipop composition** — the shaded range area and discrete lollipop markers coexist as independent layers
- **Layer order controls z-stacking** — area renders first (background), stems and dots on top
- **The same `AxisChart` drives both visual forms** — no duplication of axis logic
