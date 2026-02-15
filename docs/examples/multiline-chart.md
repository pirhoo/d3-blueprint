# Multiline Chart

Multiple series on the same chart, each rendered as its own line. The data shape is an array of series objects, and each series participates in the enter/exit lifecycle. Add or remove a series and it appears or disappears smoothly. Axes are handled by a reusable [AxisChart](./reusable-components.md) attachment.

## Live Preview

<ClientOnly>
  <MultilineChartDemo />
</ClientOnly>

## Full Source

```js
import { select, pointer } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { max } from 'd3-array';
import { line, curveCatmullRom } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { Tooltip } from './plugins/Tooltip.js';

const COLORS = ['steelblue', '#e45858', '#50a060'];
const MARGIN = { top: 20, right: 80, bottom: 30, left: 45 };

class MultilineChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().range(COLORS);
    this.lineFn = line().curve(curveCatmullRom);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Reusable axis component
    this.attach('axes', AxisChart, this.chart);

    // Layer 1: one path per series
    const linesGroup = this.chart.append('g').attr('class', 'lines');

    this.layer('lines', linesGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('path').data(data, (d) => d.name);
      },
      insert: (selection) => {
        return selection.append('path');
      },
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'none')
            .attr('stroke', (d) => this.colorScale(d.name))
            .attr('stroke-width', 2)
            .attr('d', (d) => this.lineFn(d.values));
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('stroke', (d) => this.colorScale(d.name))
            .attr('d', (d) => this.lineFn(d.values));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer 2: inline labels at the end of each line
    const labelsGroup = this.chart.append('g').attr('class', 'labels');

    this.layer('labels', labelsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('text').data(data, (d) => d.name);
      },
      insert: (selection) => {
        return selection.append('text');
      },
      events: {
        enter: (selection) => {
          selection
            .attr('dy', '0.35em')
            .attr('font-size', '11px')
            .attr('font-weight', '500')
            .attr('fill', (d) => this.colorScale(d.name))
            .text((d) => d.name);
          this._positionLabels(selection);
        },
        'merge:transition': (transition) => {
          this._positionLabels(transition);
          transition.duration(800);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Crosshair + overlay for mouse tracking
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    this.crosshair = this.chart
      .append('line')
      .attr('class', 'crosshair')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#999')
      .attr('stroke-dasharray', '4,3')
      .attr('stroke-width', 1)
      .style('display', 'none');

    this.tooltip = new Tooltip(this.chart);

    this.overlay = this.chart
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .style('pointer-events', 'all');
  }

  _positionLabels(sel) {
    sel
      .attr('x', (d) => {
        const last = d.values[d.values.length - 1];
        return this.xScale(last.x) + 8;
      })
      .attr('y', (d) => {
        const last = d.values[d.values.length - 1];
        return this.yScale(last.value);
      });
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    const allValues = data.flatMap((s) => s.values);
    const pointCount = data[0].values.length;

    this.xScale.domain([0, pointCount - 1]).range([0, innerWidth]);
    this.yScale.domain([0, max(allValues, (d) => d.value) * 1.1]).range([innerHeight, 0]);
    this.colorScale.domain(data.map((d) => d.name));

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
    const { xScale, yScale, colorScale, tooltip, crosshair, overlay } = this;
    const pointCount = data[0].values.length;

    overlay
      .on('mousemove', function (event) {
        const [mx] = pointer(event, this);
        const idx = Math.max(0, Math.min(Math.round(xScale.invert(mx)), pointCount - 1));
        const cx = xScale(idx);

        crosshair.attr('x1', cx).attr('x2', cx).style('display', null);

        const lines = data.map((s) => ({
          text: `${s.name}: ${s.values[idx].value}`,
          color: colorScale(s.name),
        }));
        tooltip.show(cx, yScale(data[0].values[idx].value), lines);
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

const chart = new MultilineChart(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

// Each series has a name and an array of { x, value } points
await chart.draw([
  {
    name: 'Product A',
    values: Array.from({ length: 20 }, (_, i) => ({
      x: i,
      value: Math.round(50 + Math.random() * 100),
    })),
  },
  {
    name: 'Product B',
    values: Array.from({ length: 20 }, (_, i) => ({
      x: i,
      value: Math.round(50 + Math.random() * 100),
    })),
  },
]);
```

## Key Takeaways

- **AxisChart handles axis rendering**: the parent configures it with scales and tick counts in `preDraw()`.
- **Each series is a single datum**: the `lines` layer binds the array of series objects, so each `<path>` maps to one series keyed by `d.name`.
- **Inline labels**: a second layer places a `<text>` at the end of each line, positioned from the last data point. Extra right margin makes room for them.
- **Color scale**: `scaleOrdinal` assigns consistent colors by series name.
- **`curveCatmullRom`**: smooth interpolation that passes through each data point.
- **Crosshair tooltip**: a transparent overlay captures `mousemove` events, `xScale.invert()` finds the nearest data index, and the tooltip displays each series value colored by `colorScale`.
