# Area + Bar Overlay

A background area trend with foreground bar highlights — the area shape layer and reusable `BarsChart` composed on the same axes. Shows how `transform()` adapts the data shape for `BarsChart` while the area layer reads the original fields.

## Live Preview

<ClientOnly>
  <AreaBarOverlayDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { area, line, curveCatmullRom } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { BarsChart } from './charts/BarsChart.js';

const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };

class AreaBarOverlay extends D3Blueprint {
  // Map highlight → value so BarsChart can consume the data
  transform(data) {
    return data.map((d) => ({ ...d, value: d.highlight }));
  }

  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.areaFn = area().curve(curveCatmullRom);
    this.lineFn = line().curve(curveCatmullRom);

    // Area layer (background)
    const areaGroup = this.chart.append('g').attr('class', 'area');
    this.layer('area', areaGroup, {
      dataBind: (sel, data) => sel.selectAll('path').data([data]),
      insert: (sel) => sel.append('path'),
      events: {
        enter: (sel) => {
          sel.attr('fill', 'var(--vp-c-brand-1)')
            .attr('fill-opacity', 0.1)
            .attr('d', (d) => this.areaFn(d));
        },
        'merge:transition': (t) => t.duration(750).attr('d', (d) => this.areaFn(d)),
      },
    });

    // Area top-edge stroke
    const areaLineGroup = this.chart.append('g').attr('class', 'area-line');
    this.layer('area-line', areaLineGroup, {
      dataBind: (sel, data) => sel.selectAll('path').data([data]),
      insert: (sel) => sel.append('path'),
      events: {
        enter: (sel) => {
          sel.attr('fill', 'none')
            .attr('stroke', 'var(--vp-c-brand-1)')
            .attr('stroke-width', 1.5)
            .attr('d', (d) => this.lineFn(d));
        },
        'merge:transition': (t) => t.duration(750).attr('d', (d) => this.lineFn(d)),
      },
    });

    // Bars layer (foreground highlights)
    this.attach('bars', BarsChart, this.chart.append('g').classed('bars', true));
  }

  preDraw(data) {
    const innerWidth = 500 - MARGIN.left - MARGIN.right;
    const innerHeight = 320 - MARGIN.top - MARGIN.bottom;

    this.xScale = scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.15);

    this.yScale = scaleLinear()
      .domain([0, (max(data, (d) => d.total) ?? 0) * 1.1])
      .range([innerHeight, 0]);

    this.areaFn
      .x((d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
      .y0(innerHeight)
      .y1((d) => this.yScale(d.total));

    this.lineFn
      .x((d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
      .y((d) => this.yScale(d.total));

    this.attached.axes.config({
      xScale: this.xScale, yScale: this.yScale,
      innerWidth, innerHeight, duration: 750, yTickCount: 5,
    });

    this.attached.bars.config({
      xScale: this.xScale, yScale: this.yScale,
      innerHeight, fill: '#e45858', duration: 750, rx: 2,
    });
  }
}
```

## Usage

```js
chart.draw([
  { label: 'Jan', total: 120, highlight: 45 },
  { label: 'Feb', total: 150, highlight: 70 },
  { label: 'Mar', total: 100, highlight: 30 },
  { label: 'Apr', total: 180, highlight: 90 },
]);
```

## Key Takeaways

- **Area + BarsChart composition** — `attach()` plugs in the reusable `BarsChart` while the area is an inline layer, all sharing one `AxisChart`.
- `transform()` adds the `value` field that `BarsChart` expects — a one-line data adapter.
- Layer order ensures the area renders behind the bars for proper visual stacking.
