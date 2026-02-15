# Gradient Area Chart

Composes `AreaChart` with a vertical SVG `<linearGradient>` fill and `LineChart` on top. Demonstrates how `AreaChart`'s `fill` config accepts any valid SVG fill including `url(#...)` references.

## Live Preview

<ClientOnly>
  <GradientAreaDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { curveCatmullRom } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { AreaChart } from './charts/AreaChart.js';
import { LineChart } from './charts/LineChart.js';

class GradientAreaChart extends D3Blueprint {
  initialize() {
    this.chart = this.base.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Define SVG gradient
    const defs = this.base.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    grad.append('stop').attr('offset', '0%')
      .attr('stop-color', 'var(--vp-c-brand-1)').attr('stop-opacity', 0.4);
    grad.append('stop').attr('offset', '100%')
      .attr('stop-color', 'var(--vp-c-brand-1)').attr('stop-opacity', 0.02);

    this.attach('axes', AxisChart, this.chart);

    this.attach('area', AreaChart, this.chart.append('g'));
    this.attached.area.config({ fill: 'url(#area-gradient)', fillOpacity: 1 });

    this.attach('line', LineChart, this.chart.append('g'));
  }

  preDraw(data) {
    const xScale = scaleLinear().domain([0, data.length - 1]).range([0, innerWidth]);
    const yScale = scaleLinear().domain([0, max(data, d => d.value) * 1.1]).range([innerHeight, 0]);

    this.attached.axes.config({ xScale, yScale, innerWidth, innerHeight });
    this.attached.area.config({ xScale, yScale, innerHeight, curve: curveCatmullRom });
    this.attached.line.config({ xScale, yScale, curve: curveCatmullRom });
  }
}
```

## Usage

```js
chart.draw([
  { x: 0, value: 42 },
  { x: 1, value: 58 },
  // ...
]);
```

## Key Takeaways

- **SVG gradients** work seamlessly with `AreaChart`'s `fill` config via `url(#id)`.
- `fillOpacity: 1` ensures the gradient's own stop-opacities control transparency.
- `AreaChart` + `LineChart` compose a polished area chart with minimal code.
