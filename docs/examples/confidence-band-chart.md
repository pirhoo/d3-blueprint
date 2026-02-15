# Confidence Band Chart

Composes `AreaChart` (for the shaded confidence band) with `LineChart` (for the mean trend) via `attach()`. The area's `y0Value` config maps to the lower bound while `yValue` maps to the upper bound.

## Live Preview

<ClientOnly>
  <ConfidenceBandDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { min, max } from 'd3-array';
import { curveCatmullRom } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { AreaChart } from './charts/AreaChart.js';
import { LineChart } from './charts/LineChart.js';

class ConfidenceBandChart extends D3Blueprint {
  initialize() {
    this.chart = this.base.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);
    this.attach('band', AreaChart, this.chart.append('g'));
    this.attach('meanLine', LineChart, this.chart.append('g'));
  }

  preDraw(data) {
    const xScale = scaleLinear().domain([0, data.length - 1]).range([0, innerWidth]);
    const yScale = scaleLinear()
      .domain([min(data, d => d.low) * 0.9, max(data, d => d.high) * 1.1])
      .range([innerHeight, 0]);

    this.attached.axes.config({ xScale, yScale, innerWidth, innerHeight });
    this.attached.band.config({
      xScale, yScale, innerHeight,
      yValue: d => d.high,
      y0Value: d => d.low,
      curve: curveCatmullRom,
    });
    this.attached.meanLine.config({
      xScale, yScale,
      yValue: d => d.mean,
      curve: curveCatmullRom,
    });
  }
}
```

## Usage

```js
chart.draw([
  { x: 0, mean: 50, low: 35, high: 65 },
  { x: 1, mean: 60, low: 45, high: 75 },
  // ...
]);
```

## Key Takeaways

- **`y0Value`** on `AreaChart` creates a band between two bounds (low → high).
- `AreaChart` + `LineChart` compose naturally — the area renders the band, the line shows the mean.
- A single `draw()` call updates all three components (axes, band, and line).
