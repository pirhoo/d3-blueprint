# Moving Average Chart

Two `LineChart` instances on the same axes — raw data (thin, light) and a smoothed N-period moving average (thick, bold). Demonstrates using `strokeWidth` and `strokeOpacity` to visually differentiate series.

## Live Preview

<ClientOnly>
  <MovingAverageDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { AxisChart } from './charts/AxisChart.js';
import { LineChart } from './charts/LineChart.js';

class MovingAverageChart extends D3Blueprint {
  initialize() {
    this.chart = this.base.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Thin, light raw data line
    this.attach('rawLine', LineChart, this.chart.append('g'));
    this.attached.rawLine.config({ strokeWidth: 1, strokeOpacity: 0.35 });

    // Thick, bold moving average line
    this.attach('avgLine', LineChart, this.chart.append('g'));
    this.attached.avgLine.config({ strokeWidth: 2.5 });
  }

  preDraw(data) {
    const smoothed = movingAvg(data, 7);
    const xScale = scaleLinear().domain([0, data.length - 1]).range([0, innerWidth]);
    const yScale = scaleLinear().domain([0, max(data, d => d.value) * 1.1]).range([innerHeight, 0]);

    this.attached.axes.config({ xScale, yScale, innerWidth, innerHeight });
    this.attached.rawLine.config({ xScale, yScale });
    this.attached.avgLine.config({ xScale, yScale });

    // Draw smoothed data separately
    this.attached.avgLine.draw(smoothed);
  }
}
```

## Usage

```js
chart.draw([
  { x: 0, value: 42 },
  { x: 1, value: 58 },
  // ... 60 data points
]);
```

## Key Takeaways

- **Two `LineChart` instances** share the same scales but use different visual styles.
- `strokeOpacity` and `strokeWidth` differentiate raw vs smoothed data without needing color changes.
- The moving average is computed in `preDraw()` and drawn to the second `LineChart`.
