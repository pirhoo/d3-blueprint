# Scatter + Trend Line

Overlays a computed regression line on scatter data — the dots layer and line layer are composed in one blueprint. The trend is calculated in `preDraw()` using simple linear regression, demonstrating how lifecycle hooks can derive new visual elements from raw data.

## Live Preview

<ClientOnly>
  <ScatterTrendLineDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { max, min, sum } from 'd3-array';
import { AxisChart } from './charts/AxisChart.js';
import { Tooltip } from './plugins/Tooltip.js';

const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };

class ScatterTrendLine extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Layer 1: scatter dots
    const dotsGroup = this.chart.append('g').attr('class', 'dots');

    this.layer('dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d, i) => i);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.y))
            .attr('r', 0)
            .attr('fill', 'steelblue')
            .attr('fill-opacity', 0.6);
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('r', 4);
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('r', 4)
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.y));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Layer 2: trend line
    const trendGroup = this.chart.append('g').attr('class', 'trend');

    this.layer('trend', trendGroup, {
      dataBind: (selection) => {
        return selection.selectAll('line').data([this._trendData]);
      },
      insert: (selection) => selection.append('line'),
      events: {
        enter: (selection) => {
          selection
            .attr('x1', (d) => this.xScale(d[0].x))
            .attr('y1', (d) => this.yScale(d[0].y))
            .attr('x2', (d) => this.xScale(d[1].x))
            .attr('y2', (d) => this.yScale(d[1].y))
            .attr('stroke', '#e45858')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '6,3');
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('x1', (d) => this.xScale(d[0].x))
            .attr('y1', (d) => this.yScale(d[0].y))
            .attr('x2', (d) => this.xScale(d[1].x))
            .attr('y2', (d) => this.yScale(d[1].y));
        },
      },
    });

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;
    this.tooltip = new Tooltip(this.chart);
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    const xMin = min(data, (d) => d.x);
    const xMax = max(data, (d) => d.x);

    this.xScale.domain([0, xMax * 1.1]).range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.y) * 1.1]).range([innerHeight, 0]);

    // Compute linear regression (least squares)
    const n = data.length;
    const sumX = sum(data, (d) => d.x);
    const sumY = sum(data, (d) => d.y);
    const sumXY = sum(data, (d) => d.x * d.y);
    const sumX2 = sum(data, (d) => d.x * d.x);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    this._trendData = [
      { x: xMin, y: slope * xMin + intercept },
      { x: xMax, y: slope * xMax + intercept },
    ];

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 800,
      xTickCount: 6,
      yTickCount: 6,
    });
  }

  postDraw() {
    const tooltip = this.tooltip;
    const xScale = this.xScale;
    const yScale = this.yScale;

    this.chart.selectAll('.dots circle')
      .on('mouseenter', function (event, d) {
        select(this).attr('r', 6).attr('fill-opacity', 1);
        tooltip.show(xScale(d.x), yScale(d.y), `(${d.x}, ${d.y})`);
      })
      .on('mouseleave', function () {
        select(this).attr('r', 4).attr('fill-opacity', 0.6);
        tooltip.hide();
      });
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new ScatterTrendLine(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

// Generate scatter data with a linear trend + noise
const slope = 1.2;
const intercept = 15;
const data = Array.from({ length: 50 }, () => {
  const x = Math.random() * 100;
  const y = slope * x + intercept + (Math.random() - 0.5) * 40;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
});

await chart.draw(data);
```

## Key Takeaways

- **`preDraw()` computation** — linear regression is computed before layers draw, producing trend data consumed by the line layer.
- **Scatter dots and the trend line share the same `AxisChart` scales** — no extra axis setup needed.
- **The two layers (dots + trend line) are completely independent** — removing one doesn't affect the other.
