# Connected Scatterplot

`LineChart` with `showDots: true` and `curveCatmullRom` connecting chronological (x, y) pairs in 2D space. Year labels are added as a custom layer. Unlike typical line charts, neither axis represents time.

## Live Preview

<ClientOnly>
  <ConnectedScatterDemo />
</ClientOnly>

## Full Source

```js
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { curveCatmullRom } from 'd3-shape';
import { AxisChart } from './charts/AxisChart.js';
import { LineChart } from './charts/LineChart.js';

class ConnectedScatterplot extends D3Blueprint {
  initialize() {
    this.chart = this.base.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.attach('line', LineChart, this.chart.append('g'));
    this.attached.line.config({
      xValue: d => d.x,
      yValue: d => d.y,
      curve: curveCatmullRom,
      showDots: true,
      dotRadius: 4,
      strokeWidth: 1.5,
    });

    this.labelsGroup = this.chart.append('g').attr('class', 'year-labels');
  }

  preDraw(data) {
    const [xMin, xMax] = extent(data, d => d.x);
    const [yMin, yMax] = extent(data, d => d.y);
    const xScale = scaleLinear().domain([xMin * 0.8, xMax * 1.2]).range([0, innerWidth]);
    const yScale = scaleLinear().domain([yMin * 0.8, yMax * 1.2]).range([innerHeight, 0]);

    this.attached.axes.config({ xScale, yScale, innerWidth, innerHeight });
    this.attached.line.config({ xScale, yScale });

    // Custom year labels
    const labels = this.labelsGroup.selectAll('text').data(data, d => d.year);
    labels.enter().append('text')
      .attr('font-size', '10px').attr('text-anchor', 'middle')
      .text(d => d.year)
      .merge(labels)
      .transition().duration(800)
      .attr('x', d => xScale(d.x))
      .attr('y', d => yScale(d.y) - 8);
    labels.exit().remove();
  }
}
```

## Usage

```js
chart.draw([
  { year: 2000, x: 30.2, y: 45.1 },
  { year: 2001, x: 35.8, y: 52.3 },
  // ...
]);
```

## Key Takeaways

- **`xValue` / `yValue`** accessors let `LineChart` map arbitrary data fields, not just `x` and `value`.
- `showDots: true` with `curveCatmullRom` produces the classic connected scatterplot look.
- Year labels are a custom layer — `LineChart` handles the path and dots, you handle the rest.
