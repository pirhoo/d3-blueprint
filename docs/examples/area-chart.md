# Area Chart

A filled area chart with a smooth Catmull-Rom curve. Uses a reusable [AxisChart](./reusable-components.md) for axes and a crosshair tooltip that tracks the nearest data point on hover.

## Live Preview

<ClientOnly>
  <AreaChartDemo />
</ClientOnly>

## Full Source

```js
import { select, pointer } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { line, area, curveCatmullRom } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { Tooltip } from './charts/Tooltip.js';

const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };

class AreaChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.areaFn = area().curve(curveCatmullRom);
    this.lineFn = line().curve(curveCatmullRom);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    // Layer 1: filled area beneath the line
    const areaGroup = this.chart.append('g').attr('class', 'area');

    this.layer('area', areaGroup, {
      dataBind: (selection, data) => selection.selectAll('path').data([data]),
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'steelblue')
            .attr('fill-opacity', 0.15)
            .attr('d', (d) => this.areaFn(d));
        },
        'merge:transition': (transition) => {
          transition.duration(800).attr('d', (d) => this.areaFn(d));
        },
      },
    });

    // Layer 2: line on top of the area
    const lineGroup = this.chart.append('g').attr('class', 'line');

    this.layer('line', lineGroup, {
      dataBind: (selection, data) => selection.selectAll('path').data([data]),
      insert: (selection) => selection.append('path'),
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

    // Crosshair + overlay for mouse tracking
    this.crosshair = this.chart
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#999')
      .attr('stroke-dasharray', '4,3')
      .style('display', 'none');

    this.tooltip = new Tooltip(this.chart);

    this.overlay = this.chart
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .style('pointer-events', 'all');
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    this.xScale.domain([0, data.length - 1]).range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.value) * 1.1]).range([innerHeight, 0]);

    this.areaFn
      .x((d) => this.xScale(d.x))
      .y0(innerHeight)
      .y1((d) => this.yScale(d.value));

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

  postDraw(data) {
    const { xScale, yScale, tooltip, crosshair, overlay } = this;

    overlay
      .on('mousemove', function (event) {
        const [mx] = pointer(event, this);
        const idx = Math.max(0, Math.min(Math.round(xScale.invert(mx)), data.length - 1));
        const cx = xScale(idx);

        crosshair.attr('x1', cx).attr('x2', cx).style('display', null);
        tooltip.show(cx, yScale(data[idx].value), `Value: ${data[idx].value}`);
      })
      .on('mouseleave', () => {
        crosshair.style('display', 'none');
        tooltip.hide();
      });
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new AreaChart(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

// Generate some data points: { x: index, value: number }
const data = Array.from({ length: 30 }, (_, i) => ({
  x: i,
  value: Math.round(50 + Math.random() * 100),
}));

await chart.draw(data);
```

## Key Takeaways

- **`area()` generator fills below the line**: `y0` sets the baseline (bottom of the chart) and `y1` maps to the data value, creating the filled region.
- **Two layers share the same data**: the `area` layer draws the fill, the `line` layer draws the stroke. Both bind `[data]` as a single datum.
- **Crosshair tooltip uses an overlay**: a transparent `<rect>` captures `mousemove` events, `xScale.invert()` snaps to the nearest data index, and the crosshair line follows the cursor.
- **`curveCatmullRom`** provides smooth interpolation that passes through each data point, used on both the area and line generators.
- **AxisChart handles all axis rendering**: the parent configures it with scales and tick counts in `preDraw()`.
