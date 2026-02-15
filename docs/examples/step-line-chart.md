# Step Line Chart

Same `AxisChart` + line/dots layer pattern as the [Line Chart](./line-chart.md), but with `curveStep` instead of `curveCatmullRom`. Swapping one D3 curve function produces a completely different visual — the blueprint structure stays identical.

## Live Preview

<ClientOnly>
  <StepLineChartDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { line, curveStep } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';

const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };

class StepLineChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    // Only difference: curveStep instead of curveCatmullRom
    this.lineFn = line().curve(curveStep);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Line layer — identical to LineChart
    const lineGroup = this.chart.append('g').attr('class', 'line');
    this.layer('line', lineGroup, {
      dataBind: (sel, data) => sel.selectAll('path').data([data]),
      insert: (sel) => sel.append('path'),
      events: {
        enter: (sel) => {
          sel.attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 2)
            .attr('d', (d) => this.lineFn(d));
        },
        'merge:transition': (t) => {
          t.duration(800).attr('d', (d) => this.lineFn(d));
        },
      },
    });

    // Dots layer — identical to LineChart
    const dotsGroup = this.chart.append('g').attr('class', 'dots');
    this.layer('dots', dotsGroup, {
      dataBind: (sel, data) => sel.selectAll('circle').data(data, (d) => d.x),
      insert: (sel) => sel.append('circle'),
      events: {
        enter: (sel) => {
          sel.attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.value))
            .attr('r', 0).attr('fill', 'steelblue');
        },
        'enter:transition': (t) => t.duration(400).attr('r', 3),
        'merge:transition': (t) => {
          t.duration(800)
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.value));
        },
        'exit:transition': (t) => t.duration(200).attr('r', 0).remove(),
      },
    });
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    this.xScale.domain([0, data.length - 1]).range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.value) * 1.1]).range([innerHeight, 0]);

    this.lineFn.x((d) => this.xScale(d.x)).y((d) => this.yScale(d.value));

    this.attached.axes.config({ xScale: this.xScale, yScale: this.yScale, innerWidth, innerHeight, duration: 800, xTickCount: 6, yTickCount: 5 });
  }
}
```

## Key Takeaways

- **One import swap** (`curveStep` for `curveCatmullRom`) changes the entire visual character.
- The line and dots layers are structurally identical to LineChart — copy-paste reuse.
- `AxisChart` works with any D3 scale type, requiring zero changes.
