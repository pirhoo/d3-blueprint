# Sparkline Grid

Demonstrates that `LineChart` works **without** `AxisChart` — axes are fully optional. Six tiny sparklines render in a 2×3 grid using only the reusable `LineChart` component.

## Live Preview

<ClientOnly>
  <SparklineGridDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { LineChart } from './charts/LineChart.js';

class SparklineGrid extends D3Blueprint {
  initialize() {
    this.sparklines = [];
    for (let idx = 0; idx < 6; idx++) {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const g = this.base.append('g')
        .attr('transform', `translate(${col * 162},${row * 72})`);

      g.append('rect')
        .attr('width', 150).attr('height', 60)
        .attr('rx', 4)
        .attr('fill', 'var(--vp-c-bg-soft)')
        .attr('stroke', 'var(--vp-c-divider)');

      const inner = g.append('g').attr('transform', 'translate(4,4)');
      this.attach(`spark-${idx}`, LineChart, inner);
      this.attached[`spark-${idx}`].config({ stroke: colors[idx], strokeWidth: 1.5 });
      this.sparklines.push(this.attached[`spark-${idx}`]);
    }
  }

  preDraw(allSeries) {
    allSeries.forEach((data, idx) => {
      const xScale = scaleLinear().domain([0, data.length - 1]).range([0, 142]);
      const [yMin, yMax] = extent(data, d => d.value);
      const yScale = scaleLinear().domain([yMin * 0.9, yMax * 1.1]).range([52, 0]);
      this.sparklines[idx].config({ xScale, yScale });
    });
  }
}
```

## Usage

```js
// Each sparkline is drawn individually
allSeries.forEach((data, idx) => {
  grid.sparklines[idx].draw(data);
});
```

## Key Takeaways

- **No AxisChart required** — `LineChart` is self-contained and works standalone.
- Each sparkline is a separate `LineChart` instance attached to the parent via `attach()`.
- The grid layout is pure SVG `<g>` transforms — no CSS grid needed.
