# Bump Chart

Multiple `LineChart` instances with `curveBumpX` and `showDots: true` show ranking changes across periods. Uses `LegendChart` for a color key and `AxisChart` with custom `yTickFormat` for rank labels.

## Live Preview

<ClientOnly>
  <BumpChartDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear, scalePoint, scaleOrdinal } from 'd3-scale';
import { curveBumpX } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { LineChart } from './charts/LineChart.js';
import { LegendChart } from './charts/LegendChart.js';

const SERIES = ['Alpha', 'Beta', 'Gamma', 'Delta'];
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060', '#f59e0b'];

class BumpChart extends D3Blueprint {
  initialize() {
    this.chart = this.base.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.lines = SERIES.map((name, i) => {
      this.attach(`line-${name}`, LineChart, this.chart.append('g'));
      const lc = this.attached[`line-${name}`];
      lc.config({
        stroke: COLORS[i],
        strokeWidth: 2.5,
        showDots: true,
        dotRadius: 4,
        curve: curveBumpX,
      });
      return lc;
    });

    this.attach('legend', LegendChart,
      this.chart.append('g').attr('transform', 'translate(0,-20)')
    );
  }

  preDraw(data) {
    const xScale = scalePoint().domain(periods).range([0, innerWidth]).padding(0.5);
    const yScale = scaleLinear().domain([0.5, SERIES.length + 0.5]).range([0, innerHeight]);

    this.attached.axes.config({
      xScale, yScale, innerWidth, innerHeight,
      yTickFormat: d => `#${d}`,
    });

    this.lines.forEach((lc) => {
      lc.config({ xScale, yScale, xValue: d => d.x, yValue: d => d.value });
    });

    this.attached.legend.config({
      items: SERIES.map((s, i) => ({ key: s, color: COLORS[i], label: s })),
    });
  }
}
```

## Usage

```js
chart.draw([
  { period: 'Q1', ranks: { Alpha: 1, Beta: 3, Gamma: 2, Delta: 4 } },
  { period: 'Q2', ranks: { Alpha: 2, Beta: 1, Gamma: 4, Delta: 3 } },
  // ...
]);
```

## Key Takeaways

- **`curveBumpX`** creates smooth S-shaped transitions between rank positions.
- Each series is a separate `LineChart` with its own color, composed via `attach()`.
- `LegendChart` provides a reusable color key with zero inline code.
- `yTickFormat` on `AxisChart` customizes labels to show `#1`, `#2`, etc.
