# Rounded Bar Chart

Same `AxisChart` + `BarsChart` as the [Bar Chart](./bar-chart.md), but with a single config change: `rx: 4`. This shows how d3-blueprint's reusable components can be restyled without touching any rendering logic.

## Live Preview

<ClientOnly>
  <RoundedBarChartDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { AxisChart } from './charts/AxisChart.js';
import { BarsChart } from './charts/BarsChart.js';

const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };

class RoundedBarChart extends D3Blueprint {
  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.attach('bars', BarsChart, this.chart.append('g').classed('bars', true));
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    this.xScale = scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.1);

    this.yScale = scaleLinear()
      .domain([0, max(data, (d) => d.value) ?? 0])
      .range([innerHeight, 0]);

    this.attached.axes.config({ xScale: this.xScale, yScale: this.yScale, innerWidth, innerHeight, duration: 750 });
    // Only difference: rx: 4
    this.attached.bars.config({ xScale: this.xScale, yScale: this.yScale, innerHeight, fill: 'steelblue', duration: 750, rx: 4 });
  }
}
```

## Key Takeaways

- **One config change** (`rx: 4`) transforms sharp bars into rounded bars — no new layers, no new components.
- The same `BarsChart` handles enter/update/exit transitions exactly as before.
- This pattern demonstrates how `config()` lets you restyle attachments without subclassing.
