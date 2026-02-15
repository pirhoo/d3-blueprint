# Histogram + Density Curve

Two representations of the same distribution — discrete histogram bins and a continuous KDE curve — sharing one `AxisChart`. The `transform()` hook bins raw values AND computes the density estimate, feeding both layers from a single data source.

## Live Preview

<ClientOnly>
  <HistogramDensityDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { max, bin, mean } from 'd3-array';
import { line, curveBasis } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { Tooltip } from './charts/Tooltip.js';

const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };

function gaussianKernel(bandwidth) {
  return (v) =>
    Math.exp(-0.5 * (v / bandwidth) ** 2) / (bandwidth * Math.sqrt(2 * Math.PI));
}

function kde(kernel, thresholds, data) {
  return thresholds.map((t) => ({ x: t, y: mean(data, (d) => kernel(t - d)) }));
}

class HistogramDensity extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.densityScale = scaleLinear();
    this.lineFn = line().curve(curveBasis);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    // Layer 1: histogram bars
    const barsGroup = this.chart.append('g').attr('class', 'bars');

    this.layer('bars', barsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('rect').data(data.bins, (d) => d.x0);
      },
      insert: (selection) => selection.append('rect'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(d.x0) + 1)
            .attr('width', (d) => Math.max(0, this.xScale(d.x1) - this.xScale(d.x0) - 2))
            .attr('y', innerHeight)
            .attr('height', 0)
            .attr('fill', 'steelblue')
            .attr('fill-opacity', 0.5)
            .attr('rx', 1);
        },
        'enter:transition': (transition) => {
          transition
            .duration(600)
            .attr('y', (d) => this.yScale(d.length))
            .attr('height', (d) => innerHeight - this.yScale(d.length));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x', (d) => this.xScale(d.x0) + 1)
            .attr('width', (d) => Math.max(0, this.xScale(d.x1) - this.xScale(d.x0) - 2))
            .attr('y', (d) => this.yScale(d.length))
            .attr('height', (d) => innerHeight - this.yScale(d.length));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer 2: density curve
    const curveGroup = this.chart.append('g').attr('class', 'curve');

    this.layer('curve', curveGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('path').data([data.curve]);
      },
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'none')
            .attr('stroke', '#e45858')
            .attr('stroke-width', 2.5)
            .attr('d', (d) => this.lineFn(d));
        },
        'merge:transition': (transition) => {
          transition.duration(600).attr('d', (d) => this.lineFn(d));
        },
      },
    });

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    this.tooltip = new Tooltip(this.chart);
  }

  transform(data) {
    this.xScale.domain([0, 100]);
    const bins = bin().domain(this.xScale.domain()).thresholds(20)(data);

    const thresholds = Array.from({ length: 100 }, (_, i) => i);
    const curve = kde(gaussianKernel(3), thresholds, data);

    return { bins, curve };
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    this.xScale.range([0, innerWidth]);
    this.yScale.domain([0, max(data.bins, (d) => d.length)]).range([innerHeight, 0]).nice();

    this.densityScale = scaleLinear()
      .domain([0, max(data.curve, (d) => d.y)])
      .range([innerHeight, 0]);

    this.lineFn
      .x((d) => this.xScale(d.x))
      .y((d) => this.densityScale(d.y));

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 600,
      xTickCount: 10,
      yTickCount: 5,
    });
  }

  postDraw(data) {
    const tooltip = this.tooltip;
    const xScale = this.xScale;
    const yScale = this.yScale;

    this.chart.selectAll('.bars rect')
      .on('mouseenter', function (event, d) {
        select(this).attr('fill-opacity', 0.8);
        tooltip.show(
          xScale((d.x0 + d.x1) / 2),
          yScale(d.length),
          `${d.x0}–${d.x1}: ${d.length} values`,
        );
      })
      .on('mouseleave', function () {
        select(this).attr('fill-opacity', 0.5);
        tooltip.hide();
      });
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new HistogramDensity(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

// Pass raw continuous values. transform() bins them and computes KDE.
const data = Array.from({ length: 500 }, () => {
  const u = 1 - Math.random();
  const v = Math.random();
  const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return 50 + normal * 15;
});

await chart.draw(data);
```

## Key Takeaways

- **`transform()` produces compound data** — returns `{ bins, curve }` that feeds two completely different layers.
- **The histogram bars and density curve use separate y-scales** (count vs. density), but share the same x-axis.
- **Kernel Density Estimation (KDE) is computed inline** — no external library needed, just a Gaussian kernel function.
