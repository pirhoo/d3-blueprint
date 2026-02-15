# Sorted Bar Chart

Uses the `transform()` hook to sort data before drawing — the same `BarsChart` animates bars to their new positions. This example cycles between original, ascending, and descending sort orders.

## Live Preview

<ClientOnly>
  <SortedBarChartDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max, ascending, descending } from 'd3-array';
import { AxisChart } from './charts/AxisChart.js';
import { BarsChart } from './charts/BarsChart.js';

const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };

class SortedBarChart extends D3Blueprint {
  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);
    this.attach('bars', BarsChart, this.chart.append('g').classed('bars', true));
  }

  // transform() intercepts data before preDraw/draw
  transform(data) {
    if (this._sortMode === 'asc') {
      return [...data].sort((a, b) => ascending(a.value, b.value));
    }
    if (this._sortMode === 'desc') {
      return [...data].sort((a, b) => descending(a.value, b.value));
    }
    return data;
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
    this.attached.bars.config({ xScale: this.xScale, yScale: this.yScale, innerHeight, fill: 'steelblue', duration: 750 });
  }
}
```

## Usage

```js
const chart = new SortedBarChart(svg);
chart._sortMode = 'original';
chart.draw(data);

// Change sort and redraw — bars animate to new positions
chart._sortMode = 'asc';
chart.draw(data);
```

## Key Takeaways

- **`transform()`** preprocesses data before `preDraw()` sees it — the rest of the chart is unaware of sorting.
- The same `BarsChart` handles animated reordering through its enter/update/exit transitions.
- No new components needed — just one lifecycle hook adds sorting behaviour.
