# Normalized Line Chart

Three series each indexed to 100% at the first data point, making relative performance easy to compare. Uses `AxisChart` with `yTickFormat: d => d + '%'` and `LegendChart` for the color key.

## Live Preview

<ClientOnly>
  <NormalizedChartDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { min, max } from 'd3-array';
import { curveCatmullRom } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { LineChart } from './charts/LineChart.js';
import { LegendChart } from './charts/LegendChart.js';

function normalize(series) {
  return series.map(s => {
    const base = s.values[0].raw;
    return {
      name: s.name,
      values: s.values.map(d => ({ x: d.x, value: Math.round((d.raw / base) * 100) })),
    };
  });
}

class NormalizedChart extends D3Blueprint {
  initialize() {
    this.chart = this.base.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.lines = SERIES_NAMES.map((name, i) => {
      this.attach(`line-${name}`, LineChart, this.chart.append('g'));
      const lc = this.attached[`line-${name}`];
      lc.config({ stroke: COLORS[i], curve: curveCatmullRom });
      return lc;
    });

    this.attach('legend', LegendChart,
      this.chart.append('g').attr('transform', 'translate(0,-20)')
    );
  }

  preDraw(data) {
    const normalized = normalize(data);
    const allValues = normalized.flatMap(s => s.values);

    this.attached.axes.config({
      xScale, yScale, innerWidth, innerHeight,
      yTickFormat: d => d + '%',
    });

    this.lines.forEach((lc) => lc.config({ xScale, yScale }));
    normalized.forEach((s, i) => this.lines[i].draw(s.values));
  }
}
```

## Usage

```js
chart.draw([
  { name: 'Fund A', values: [{ x: 0, raw: 100 }, { x: 1, raw: 115 }, ...] },
  { name: 'Fund B', values: [{ x: 0, raw: 80 }, { x: 1, raw: 90 }, ...] },
  { name: 'Fund C', values: [{ x: 0, raw: 120 }, { x: 1, raw: 130 }, ...] },
]);
```

## Key Takeaways

- **Normalization** in `preDraw()` converts raw values to percentages relative to the first data point.
- `yTickFormat` on `AxisChart` appends `%` to tick labels with a single config.
- Multiple `LineChart` instances + `LegendChart` compose a multi-series comparison chart.
