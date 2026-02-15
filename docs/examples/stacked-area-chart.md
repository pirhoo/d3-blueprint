# Stacked Area Chart

Multiple series stacked as filled areas with smooth Catmull-Rom curves. Uses `d3-shape`'s `stack()` layout to compute y0/y1 pairs and a reusable [AxisChart](./reusable-components.md) for axes. Includes a crosshair tooltip for multi-series inspection.

## Live Preview

<ClientOnly>
  <StackedAreaDemo />
</ClientOnly>

## Full Source

```js
import { select, pointer } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { max } from 'd3-array';
import { stack, area, curveCatmullRom } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from './plugins/Tooltip.js';

const COLORS = ['steelblue', '#e45858', '#50a060'];
const KEYS = ['Desktop', 'Mobile', 'Tablet'];
const MARGIN = { top: 20, right: 80, bottom: 30, left: 45 };

class StackedAreaChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().domain(KEYS).range(COLORS);
    this.areaFn = area().curve(curveCatmullRom);
    this.stacked = [];

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Layer 1: one path per stacked series
    const areasGroup = this.chart.append('g').attr('class', 'areas');

    this.layer('areas', areasGroup, {
      dataBind: (selection) => {
        return selection.selectAll('path').data(this.stacked, (d) => d.key);
      },
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', (d) => this.colorScale(d.key))
            .attr('fill-opacity', 0.7)
            .attr('d', (d) => this.areaFn(d));
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('fill', (d) => this.colorScale(d.key))
            .attr('d', (d) => this.areaFn(d));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer 2: inline labels at the end of each series
    const labelsGroup = this.chart.append('g').attr('class', 'labels');

    this.layer('labels', labelsGroup, {
      dataBind: (selection) => {
        return selection.selectAll('text').data(KEYS);
      },
      insert: (selection) => selection.append('text'),
      events: {
        merge: (selection) => {
          selection
            .attr('dy', '0.35em')
            .attr('font-size', '11px')
            .attr('font-weight', '500')
            .attr('fill', (d) => this.colorScale(d))
            .text((d) => d);
          this._positionLabels(selection);
        },
      },
    });

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    // Crosshair + overlay for mouse tracking
    this.crosshair = this.chart
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#999')
      .attr('stroke-dasharray', '4,3')
      .style('display', 'none');

    this.tooltip = tooltipPlugin(this.chart);

    this.overlay = this.chart
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .style('pointer-events', 'all');
  }

  _positionLabels(sel) {
    const lastIdx = this.stacked[0]?.length - 1;
    if (lastIdx == null) return;

    sel.each((key, i, nodes) => {
      const series = this.stacked.find((s) => s.key === key);
      if (!series) return;
      const d = series[lastIdx];
      const midY = (this.yScale(d[0]) + this.yScale(d[1])) / 2;
      select(nodes[i])
        .attr('x', this.xScale(lastIdx) + 8)
        .attr('y', midY);
    });
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    this.stacked = stack().keys(KEYS)(data);
    const maxVal = max(this.stacked[this.stacked.length - 1], (d) => d[1]);

    this.xScale.domain([0, data.length - 1]).range([0, innerWidth]);
    this.yScale.domain([0, maxVal * 1.05]).range([innerHeight, 0]);

    this.areaFn
      .x((d) => this.xScale(d.data.x))
      .y0((d) => this.yScale(d[0]))
      .y1((d) => this.yScale(d[1]));

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
    const { xScale, yScale, colorScale, tooltip, crosshair, overlay } = this;

    overlay
      .on('mousemove', function (event) {
        const [mx] = pointer(event, this);
        const idx = Math.max(0, Math.min(Math.round(xScale.invert(mx)), data.length - 1));
        const cx = xScale(idx);

        crosshair.attr('x1', cx).attr('x2', cx).style('display', null);

        const lines = KEYS.map((key) => ({
          text: `${key}: ${data[idx][key]}`,
          color: colorScale(key),
        }));
        tooltip.show(cx, yScale(data[idx].Desktop + data[idx].Mobile + data[idx].Tablet), lines);
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

const chart = new StackedAreaChart(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

// Each row has an x index plus one value per series key
const data = Array.from({ length: 12 }, (_, i) => ({
  x: i,
  Desktop: 20 + Math.round(Math.random() * 40),
  Mobile: 10 + Math.round(Math.random() * 30),
  Tablet: 5 + Math.round(Math.random() * 15),
}));

await chart.draw(data);
```

## Key Takeaways

- **`stack()` computes y0/y1 pairs**: D3's stack layout transforms flat rows into nested arrays where each point has `[y0, y1]` boundaries, so the areas stack on top of each other without overlap.
- **`area()` uses y0/y1 for stacking**: unlike a simple area chart that uses `y0(baseline)`, the stacked version reads both `y0` and `y1` from the stack layout output.
- **Same crosshair pattern as the multiline chart**: a transparent overlay captures `mousemove`, snaps to the nearest data index, and shows all series values in the tooltip.
- **`dataBind` reads `this.stacked`**: since `preDraw()` stores the computed stack on the instance, the layer ignores the raw data argument and reads from the precomputed property.
- **Inline labels**: positioned at the midpoint of each series at the rightmost data point, with extra right margin to accommodate them.
