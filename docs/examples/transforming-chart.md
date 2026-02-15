# Transforming Chart

This example shows the same dataset rendered in four different ways, with smooth animated transitions between each mode. A single `mode` config drives the transformation: **multiline → variation (%) → stacked areas → stacked bars**.

## Live Preview

<ClientOnly>
  <TransformingChartDemo />
</ClientOnly>

## How It Works

One chart class, four visual modes. The `mode` config controls everything:

1. **Multiline**: raw values as individual lines (y-axis shows absolute numbers)
2. **Variation (%)**: percentage change from each series' first value, allowing the y-axis to go negative for declining series
3. **Stacked Areas**: percentage-of-total stacked as filled areas (y-axis 0-100)
4. **Stacked Bars**: the same stacking shown as discrete bars

Each call to `draw()` re-uses the same data. Only `config('mode')` changes.

## Key Patterns

### Data transformation in `preDraw`

All four modes share the same input data. The `preDraw` method computes different `seriesData` shapes depending on the mode:

```js
preDraw(data) {
  const mode = this.config('mode');

  if (mode === 'lines') {
    // Raw values: y0 = 0, y1 = value
    this.seriesData = data.map((s) => ({
      name: s.name,
      points: s.values.map((v, i) => ({ x: i, y0: 0, y1: v })),
    }));
  } else if (mode === 'base0') {
    // Percentage variation from first value. Can go negative.
    this.seriesData = data.map((s) => ({
      name: s.name,
      points: s.values.map((v, i) => ({
        x: i,
        y0: 0,
        y1: ((v - s.values[0]) / s.values[0]) * 100,
      })),
    }));
  } else {
    // Normalize each column to percentage of total
    const normalized = data[0].values.map((_, i) => {
      const total = data.reduce((sum, s) => sum + s.values[i], 0);
      return data.map((s) => (s.values[i] / total) * 100);
    });

    // Stacked: y0 = cumulative bottom, y1 = cumulative top
    this.seriesData = data.map((s, si) => ({
      name: s.name,
      points: normalized.map((col, i) => {
        const y0 = col.slice(0, si).reduce((a, b) => a + b, 0);
        return { x: i, y0, y1: y0 + col[si] };
      }),
    }));
  }
}
```

### Three visual layers

The chart uses three layers that fade in and out depending on the mode:

| Layer | Elements | Visible in |
|---|---|---|
| `areas` | `<path>` per series (area generator) | Stacked Areas only |
| `lines` | `<path>` per series (line generator) | Multiline, Base 100, Stacked Areas (thin) |
| `bar-groups` | `<rect>` elements per series | Stacked Bars only |

All layers are always present but hidden via `fill-opacity` or `opacity` when not active. Transitions cross-fade between them:

```js
// Areas layer: visible only in 'areas' mode
'merge:transition': (transition) => {
  const mode = this.config('mode');
  transition.duration(800)
    .attr('fill-opacity', mode === 'areas' ? 0.65 : 0)
    .attr('d', (d) => this.areaFn(d.points));
},

// Lines layer: hidden in 'bars' mode, thinner in 'areas' mode
'merge:transition': (transition) => {
  const mode = this.config('mode');
  transition.duration(800)
    .attr('stroke-width', mode === 'lines' || mode === 'base0' ? 2.5 : mode === 'areas' ? 1.5 : 0)
    .attr('opacity', mode === 'bars' ? 0 : 1)
    .attr('d', (d) => this.lineFn(d.points));
},
```

### Smooth path morphing

The area and line paths use `curveLinear` (the default) across all modes. Because the curve type and number of data points stay constant, the SVG path command structure is identical between modes. This lets d3's default string interpolation smoothly morph the paths, so lines "flow" into areas as the `y0` values shift from 0 to stacked positions.

### Cycling modes

The Vue setup cycles through modes on a timer, calling `draw()` with the same dataset each time:

```js
intervalId = setInterval(() => {
  modeIndex = (modeIndex + 1) % MODES.length;
  chart.config('mode', MODES[modeIndex]);
  chart.draw(SERIES);
}, 3000);
```

## Full Source

```js
import { select } from 'd3-selection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { min, max } from 'd3-array';
import { area, line } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';

const WIDTH = 560;
const HEIGHT = 380;
const MARGIN = { top: 44, right: 20, bottom: 50, left: 45 };
const COLORS = ['#4a7dff', '#e45858', '#50a060'];
const MODES = ['lines', 'base0', 'areas', 'bars'];
const MODE_LABELS = {
  lines: 'Multiline',
  base0: 'Variation (%)',
  areas: 'Stacked Areas (%)',
  bars: 'Stacked Bars (%)',
};
const POINT_COUNT = 20;

class TransformingChart extends D3Blueprint {
  initialize() {
    this.configDefine('mode', { defaultValue: 'lines' });

    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().range(COLORS);
    this.areaFn = area();
    this.lineFn = line();
    this.seriesData = [];
    this.seriesNames = [];

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.modeLabel = this.chart
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -18)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', '600');

    // Layer: area fills (visible in 'areas' mode)
    const areasGroup = this.chart.append('g').attr('class', 'areas');
    this.layer('areas', areasGroup, {
      dataBind: (selection) =>
        selection.selectAll('path').data(this.seriesData, (d) => d.name),
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', (d) => this.colorScale(d.name))
            .attr('fill-opacity', 0)
            .attr('d', (d) => this.areaFn(d.points));
        },
        'merge:transition': (transition) => {
          const mode = this.config('mode');
          transition.duration(800)
            .attr('fill-opacity', mode === 'areas' ? 0.65 : 0)
            .attr('d', (d) => this.areaFn(d.points));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('fill-opacity', 0).remove();
        },
      },
    });

    // Layer: bar groups (visible in 'bars' mode)
    const barsGroup = this.chart.append('g').attr('class', 'bar-groups');
    this.layer('bar-groups', barsGroup, {
      dataBind: (selection) =>
        selection.selectAll('g.series').data(this.seriesData, (d) => d.name),
      insert: (selection) => selection.append('g').attr('class', 'series'),
      events: {
        merge: (selection) => {
          selection.attr('fill', (d) => this.colorScale(d.name));
          this._drawBars(selection);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer: line strokes (visible in line modes, thin in areas)
    const linesGroup = this.chart.append('g').attr('class', 'lines');
    this.layer('lines', linesGroup, {
      dataBind: (selection) =>
        selection.selectAll('path').data(this.seriesData, (d) => d.name),
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'none')
            .attr('stroke', (d) => this.colorScale(d.name))
            .attr('stroke-width', 2.5)
            .attr('d', (d) => this.lineFn(d.points));
        },
        'merge:transition': (transition) => {
          const mode = this.config('mode');
          transition.duration(800)
            .attr('stroke-width', mode === 'lines' || mode === 'base0' ? 2.5 : mode === 'areas' ? 1.5 : 0)
            .attr('opacity', mode === 'bars' ? 0 : 1)
            .attr('d', (d) => this.lineFn(d.points));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer: legend
    const legendGroup = this.chart.append('g').attr('class', 'legend');
    this.layer('legend', legendGroup, {
      dataBind: (selection) =>
        selection.selectAll('g.legend-item').data(this.seriesNames),
      insert: (selection) => {
        const g = selection.append('g').attr('class', 'legend-item');
        g.append('rect');
        g.append('text');
        return g;
      },
      events: {
        merge: (selection) => {
          const totalWidth = this.seriesNames.length * 90;
          const startX = (innerWidth - totalWidth) / 2;
          selection.attr('transform', (d, i) =>
            `translate(${startX + i * 90}, ${innerHeight + 28})`);
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
  }

  _drawBars(seriesSelection) {
    const self = this;
    const mode = this.config('mode');
    const barWidth = this.barWidth;

    seriesSelection.each(function () {
      const group = select(this);
      const rects = group.selectAll('rect').data((d) => d.points);

      rects.enter()
        .append('rect')
        .attr('x', (d) => self.xScale(d.x) - barWidth / 2)
        .attr('y', (d) => self.yScale(d.y1))
        .attr('width', barWidth)
        .attr('height', (d) => Math.max(0, self.yScale(d.y0) - self.yScale(d.y1)))
        .attr('rx', 2)
        .attr('opacity', 0)
      .merge(rects)
        .transition()
        .duration(800)
        .attr('x', (d) => self.xScale(d.x) - barWidth / 2)
        .attr('y', (d) => self.yScale(d.y1))
        .attr('width', barWidth)
        .attr('height', (d) => Math.max(0, self.yScale(d.y0) - self.yScale(d.y1)))
        .attr('opacity', mode === 'bars' ? 0.9 : 0);

      rects.exit().transition().duration(200).attr('opacity', 0).remove();
    });
  }

  preDraw(data) {
    const mode = this.config('mode');
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.colorScale.domain(data.map((d) => d.name));
    this.seriesNames = data.map((d) => d.name);
    this.xScale.domain([0, POINT_COUNT - 1]).range([0, innerWidth]);
    this.barWidth = (innerWidth / POINT_COUNT) * 0.8;

    if (mode === 'lines') {
      const maxVal = max(data.flatMap((s) => s.values)) * 1.1;
      this.yScale.domain([0, maxVal]).range([innerHeight, 0]).nice();

      this.seriesData = data.map((s) => ({
        name: s.name,
        points: s.values.map((v, i) => ({ x: i, y0: 0, y1: v })),
      }));
    } else if (mode === 'base0') {
      // Percentage variation from first value. Can go negative.
      const variations = data.flatMap((s) =>
        s.values.map((v) => ((v - s.values[0]) / s.values[0]) * 100),
      );
      this.yScale
        .domain([min(variations), max(variations)])
        .range([innerHeight, 0])
        .nice();

      this.seriesData = data.map((s) => ({
        name: s.name,
        points: s.values.map((v, i) => ({
          x: i,
          y0: 0,
          y1: ((v - s.values[0]) / s.values[0]) * 100,
        })),
      }));
    } else {
      // Stacked percentages (areas or bars)
      this.yScale.domain([0, 100]).range([innerHeight, 0]);

      const normalized = data[0].values.map((_, i) => {
        const total = data.reduce((sum, s) => sum + s.values[i], 0);
        return data.map((s) => (s.values[i] / total) * 100);
      });

      this.seriesData = data.map((s, si) => ({
        name: s.name,
        points: normalized.map((col, i) => {
          const y0 = col.slice(0, si).reduce((a, b) => a + b, 0);
          const y1 = y0 + col[si];
          return { x: i, y0, y1 };
        }),
      }));
    }

    this.areaFn
      .x((d) => this.xScale(d.x))
      .y0((d) => this.yScale(d.y0))
      .y1((d) => this.yScale(d.y1));

    this.lineFn
      .x((d) => this.xScale(d.x))
      .y((d) => this.yScale(d.y1));

    this.modeLabel.text(MODE_LABELS[mode]);

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 800,
      xTickCount: 5,
      yTickCount: 5,
    });
  }
}
```
