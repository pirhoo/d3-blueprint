# Responsive Bar Chart

This example shows how to make a d3compose chart resize to fit its container. The key idea: use a `ResizeObserver` to detect width changes, update the config, and redraw.

## Live Preview

<ClientOnly>
  <ResponsiveBarChartDemo />
</ClientOnly>

## Full Source

```js
import { D3Compose } from 'd3compose';
import { scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { max } from 'd3-array';

class ResponsiveBarChart extends D3Compose {
  initialize() {
    this.xScale = scaleBand().padding(0.1);
    this.yScale = scaleLinear();
    this.innerWidth = 0;
    this.innerHeight = 0;

    this.configDefine('width', { defaultValue: 600 });
    this.configDefine('height', { defaultValue: 300 });
    this.configDefine('margin', {
      defaultValue: { top: 20, right: 20, bottom: 30, left: 40 },
    });

    const margin = this.config('margin');
    const chart = this.base
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    this.xAxisGroup = chart.append('g').attr('class', 'x-axis');
    this.yAxisGroup = chart.append('g').attr('class', 'y-axis');

    const barsGroup = chart.append('g').classed('bars', true);

    this.layer('bars', barsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('rect').data(data, (d) => d.label);
      },
      insert: (selection) => {
        return selection.append('rect');
      },
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(d.label))
            .attr('width', this.xScale.bandwidth())
            .attr('y', this.innerHeight)
            .attr('height', 0)
            .attr('rx', 2)
            .attr('fill', 'steelblue');
        },
        'enter:transition': (transition) => {
          transition
            .duration(400)
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => this.innerHeight - this.yScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(400)
            .attr('x', (d) => this.xScale(d.label))
            .attr('width', this.xScale.bandwidth())
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => this.innerHeight - this.yScale(d.value));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });
  }

  preDraw(data) {
    const width = this.config('width');
    const height = this.config('height');
    const margin = this.config('margin');

    this.innerWidth = width - margin.left - margin.right;
    this.innerHeight = height - margin.top - margin.bottom;

    // Update the SVG and viewBox to match the new width
    this.base.attr('width', width).attr('viewBox', `0 0 ${width} ${height}`);

    this.xScale.domain(data.map((d) => d.label)).range([0, this.innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.value) ?? 0]).range([this.innerHeight, 0]);

    this.xAxisGroup
      .attr('transform', `translate(0,${this.innerHeight})`)
      .transition()
      .duration(400)
      .call(axisBottom(this.xScale));

    this.yAxisGroup.transition().duration(400).call(axisLeft(this.yScale));
  }
}
```

## Making It Responsive

The chart class itself knows nothing about the DOM container — it just reads its `width` config. The responsive wiring lives outside the class:

```js
import { select } from 'd3-selection';

const container = document.querySelector('#chart');
const svg = select(container).append('svg').attr('height', 300);

const chart = new ResponsiveBarChart(svg);

const data = [
  { label: 'A', value: 30 },
  { label: 'B', value: 86 },
  { label: 'C', value: 168 },
  { label: 'D', value: 47 },
];

// Initial draw at current container width
chart.config('width', container.clientWidth);
chart.draw(data);

// Redraw whenever the container resizes
const observer = new ResizeObserver(() => {
  chart.config('width', container.clientWidth);
  chart.draw(data);
});
observer.observe(container);
```

## How It Works

1. **`configDefine('width', ...)`** makes width a runtime-configurable property.
2. **`preDraw()`** reads `this.config('width')` each time `draw()` is called and updates the SVG `width` and `viewBox` attributes so the chart fills the available space.
3. **`ResizeObserver`** watches the container element. On resize it updates the config and calls `draw()` again with the same data — bars smoothly animate to their new positions.

This pattern keeps the chart class reusable: it doesn't depend on `window`, `ResizeObserver`, or any specific container. The responsive behavior is composed from the outside.
