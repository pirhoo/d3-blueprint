# Line Chart

A simple line chart with animated dots at each data point. The chart uses a reusable [AxisChart](./reusable-components.md) for axes, plus two inline layers for the line path and dots, with a smooth Catmull-Rom curve.

## Live Preview

<ClientOnly>
  <LineChartDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { line, curveCatmullRom } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from './plugins/Tooltip.js';

const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };

class LineChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.lineFn = line().curve(curveCatmullRom);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Reusable axis component
    this.attach('axes', AxisChart, this.chart);

    // Layer 1: the line path (binds the whole array as a single datum)
    const lineGroup = this.chart.append('g').attr('class', 'line');

    this.layer('line', lineGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('path').data([data]);
      },
      insert: (selection) => {
        return selection.append('path');
      },
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 2)
            .attr('d', (d) => this.lineFn(d));
        },
        'merge:transition': (transition) => {
          transition.duration(800).attr('d', (d) => this.lineFn(d));
        },
      },
    });

    // Layer 2: dots at each data point
    const dotsGroup = this.chart.append('g').attr('class', 'dots');

    this.layer('dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.x);
      },
      insert: (selection) => {
        return selection.append('circle');
      },
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.value))
            .attr('r', 0)
            .attr('fill', 'steelblue');
        },
        'enter:transition': (transition) => {
          transition.duration(400).attr('r', 3);
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.value));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;
    this.tooltip = tooltipPlugin(this.chart);
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    this.xScale.domain([0, data.length - 1]).range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.value) * 1.1]).range([innerHeight, 0]);

    this.lineFn
      .x((d) => this.xScale(d.x))
      .y((d) => this.yScale(d.value));

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 800,
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
        select(this).attr('r', 5);
        tooltip.show(xScale(d.x), yScale(d.value), `Value: ${d.value}`);
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

const chart = new LineChart(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

// Generate some data points: { x: index, value: number }
const data = Array.from({ length: 24 }, (_, i) => ({
  x: i,
  value: Math.round(50 + Math.random() * 100),
}));

await chart.draw(data);
```

## Key Takeaways

- **AxisChart handles all axis rendering**: the parent just passes scales and tick counts via `config()`.
- **The line path binds the entire array as a single datum**: `dataBind` wraps the data in `[data]` so the line layer manages one `<path>` element.
- **Dots are a separate layer**: each dot participates in the enter/exit lifecycle independently.
- **`curveCatmullRom`** produces a smooth interpolation through the data points.
- **`d3-shape`'s `line()` generator** is configured in `preDraw()` so it always uses the current scales.
