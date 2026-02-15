# Bar + Line Combo

Composes `BarsChart` (via `attach()`) with an inline line layer in a single blueprint. This demonstrates how d3-blueprint lets you mix reusable attachments with custom layers to build composite visualizations.

## Live Preview

<ClientOnly>
  <BarLineComboDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { line } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { BarsChart } from './charts/BarsChart.js';

const MARGIN = { top: 20, right: 40, bottom: 30, left: 40 };

class BarLineCombo extends D3Blueprint {
  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Reusable attachments
    this.attach('axes', AxisChart, this.chart);
    this.attach('bars', BarsChart, this.chart.append('g').classed('bars', true));

    this.lineFn = line();

    // Inline line layer on top of bars
    const lineGroup = this.chart.append('g').attr('class', 'combo-line');
    this.layer('line', lineGroup, {
      dataBind: (sel, data) => sel.selectAll('path').data([data]),
      insert: (sel) => sel.append('path'),
      events: {
        enter: (sel) => {
          sel.attr('fill', 'none')
            .attr('stroke', 'orange')
            .attr('stroke-width', 2.5)
            .attr('d', (d) => this.lineFn(d));
        },
        'merge:transition': (t) => t.duration(750).attr('d', (d) => this.lineFn(d)),
      },
    });

    // Dots for the line
    const dotsGroup = this.chart.append('g').attr('class', 'line-dots');
    this.layer('line-dots', dotsGroup, {
      dataBind: (sel, data) => sel.selectAll('circle').data(data, (d) => d.label),
      insert: (sel) => sel.append('circle'),
      events: {
        enter: (sel) => {
          sel.attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.lineScale(d.line))
            .attr('r', 0).attr('fill', 'orange');
        },
        'enter:transition': (t) => t.duration(400).attr('r', 3),
        'merge:transition': (t) => {
          t.duration(750)
            .attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.lineScale(d.line));
        },
        'exit:transition': (t) => t.duration(200).attr('r', 0).remove(),
      },
    });
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    this.xScale = scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.15);

    const maxVal = max(data, (d) => Math.max(d.value, d.line)) ?? 0;

    this.yScale = scaleLinear().domain([0, maxVal]).range([innerHeight, 0]);
    this.lineScale = this.yScale;

    this.lineFn
      .x((d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
      .y((d) => this.lineScale(d.line));

    this.attached.axes.config({ xScale: this.xScale, yScale: this.yScale, innerWidth, innerHeight, duration: 750 });
    this.attached.bars.config({ xScale: this.xScale, yScale: this.yScale, innerHeight, fill: 'steelblue', duration: 750 });
  }
}
```

## Usage

```js
chart.draw([
  { label: 'Jan', value: 60, line: 45 },
  { label: 'Feb', value: 80, line: 70 },
  { label: 'Mar', value: 120, line: 90 },
]);
```

## Key Takeaways

- **`attach()` + `layer()`** — compose a reusable `BarsChart` with custom inline layers in one blueprint.
- Both visual forms share the same x-axis via `AxisChart`, demonstrating scale sharing.
- The data shape carries both `value` (bars) and `line` (line) — one `draw()` call updates everything.
