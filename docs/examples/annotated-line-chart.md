# Annotated Line Chart

Combines a reusable `LineChart` (via `attach()`) with custom inline annotation layers — a horizontal reference line at the average and a callout label at the peak value.

## Live Preview

<ClientOnly>
  <AnnotatedLineDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { curveCatmullRom } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { LineChart } from './charts/LineChart.js';

class AnnotatedLineChart extends D3Blueprint {
  initialize() {
    this.chart = this.base.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);
    this.attach('line', LineChart, this.chart.append('g'));

    // Custom annotation elements
    this.refLine = this.chart.append('line')
      .attr('stroke', '#e45858')
      .attr('stroke-dasharray', '6,4');

    this.refLabel = this.chart.append('text')
      .attr('fill', '#e45858')
      .attr('font-size', '11px');

    this.peakDot = this.chart.append('circle')
      .attr('fill', 'var(--vp-c-brand-1)').attr('r', 5);

    this.peakLabel = this.chart.append('text')
      .attr('fill', 'var(--vp-c-text-1)')
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle');
  }

  preDraw(data) {
    // Update annotations based on data
    const avg = data.reduce((s, d) => s + d.value, 0) / data.length;
    this.refLine.attr('y1', yScale(avg)).attr('y2', yScale(avg))
      .attr('x1', 0).attr('x2', innerWidth);
    this.refLabel.attr('x', innerWidth + 4).attr('y', yScale(avg))
      .text(`avg: ${Math.round(avg)}`);

    const peak = data.reduce((b, d) => d.value > b.value ? d : b, data[0]);
    this.peakDot.attr('cx', xScale(peak.x)).attr('cy', yScale(peak.value));
    this.peakLabel.attr('x', xScale(peak.x)).attr('y', yScale(peak.value) - 12)
      .text(`Peak: ${peak.value}`);
  }
}
```

## Usage

```js
chart.draw([
  { x: 0, value: 42 },
  { x: 1, value: 58 },
  // ... 24 data points
]);
```

## Key Takeaways

- **`attach()` + inline elements** — mix reusable `LineChart` with custom SVG annotations.
- Annotations update in `preDraw()` using the same scales as the line — zero duplication.
- Reference lines, callout labels, and highlight dots layer naturally on top of the chart.
