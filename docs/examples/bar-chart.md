# Bar Chart Example

A complete, annotated bar chart built with d3compose.

## Live Preview

<ClientOnly>
  <BarChartDemo />
</ClientOnly>

## Full Source

```ts
import { D3Compose } from 'd3compose';
import { scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { max } from 'd3-array';
import type { D3Selection } from 'd3compose';

interface BarDatum {
  label: string;
  value: number;
}

interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

class BarChart extends D3Compose<BarDatum[]> {
  private xScale = scaleBand<string>().padding(0.1);
  private yScale = scaleLinear();
  private innerWidth = 0;
  private innerHeight = 0;
  private xAxisGroup: any;
  private yAxisGroup: any;

  protected initialize(): void {
    // Define configurable properties
    this.configDefine('width', { defaultValue: 600 });
    this.configDefine('height', { defaultValue: 400 });
    this.configDefine('margin', {
      defaultValue: { top: 20, right: 20, bottom: 30, left: 40 } as Margin,
    });

    // Create SVG structure
    const margin = this.config('margin') as Margin;
    const chart = this.base
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    this.xAxisGroup = chart.append('g').attr('class', 'x-axis');
    this.yAxisGroup = chart.append('g').attr('class', 'y-axis');

    const barsGroup = chart.append('g').classed('bars', true);

    // Define the bars layer
    this.layer('bars', barsGroup as unknown as D3Selection, {
      dataBind: (selection, data) => {
        return selection
          .selectAll('rect')
          .data(data, (d: any) => d.label) as unknown as D3Selection;
      },

      insert: (selection) => {
        return selection.append('rect') as unknown as D3Selection;
      },

      events: {
        // Set initial state for entering bars
        enter: (selection) => {
          selection
            .attr('x', (d: any) => this.xScale(d.label)!)
            .attr('width', this.xScale.bandwidth())
            .attr('y', this.innerHeight)
            .attr('height', 0)
            .attr('fill', 'steelblue');
        },

        // Animate entering bars into position
        'enter:transition': (transition) => {
          transition
            .duration(750)
            .attr('y', (d: any) => this.yScale(d.value))
            .attr('height', (d: any) => this.innerHeight - this.yScale(d.value));
        },

        // Update position and size for existing + new bars
        'merge:transition': (transition) => {
          transition
            .duration(750)
            .attr('x', (d: any) => this.xScale(d.label)!)
            .attr('width', this.xScale.bandwidth())
            .attr('y', (d: any) => this.yScale(d.value))
            .attr('height', (d: any) => this.innerHeight - this.yScale(d.value));
        },

        // Fade out removed bars
        'exit:transition': (transition) => {
          transition
            .duration(300)
            .attr('opacity', 0)
            .remove();
        },
      },
    });
  }

  protected preDraw(data: BarDatum[]): void {
    const width = this.config('width') as number;
    const height = this.config('height') as number;
    const margin = this.config('margin') as Margin;

    this.innerWidth = width - margin.left - margin.right;
    this.innerHeight = height - margin.top - margin.bottom;

    // Update scales with current data
    this.xScale
      .domain(data.map((d) => d.label))
      .range([0, this.innerWidth]);

    this.yScale
      .domain([0, max(data, (d) => d.value) ?? 0])
      .range([this.innerHeight, 0]);

    // Update axes
    this.xAxisGroup
      .attr('transform', `translate(0,${this.innerHeight})`)
      .transition()
      .duration(750)
      .call(axisBottom(this.xScale));

    this.yAxisGroup
      .transition()
      .duration(750)
      .call(axisLeft(this.yScale));
  }
}
```

## Usage

```ts
import { select } from 'd3-selection';

const chart = new BarChart(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

await chart.draw([
  { label: 'A', value: 30 },
  { label: 'B', value: 86 },
  { label: 'C', value: 168 },
  { label: 'D', value: 47 },
]);

// Update with new data — bars animate to new positions
await chart.draw([
  { label: 'A', value: 80 },
  { label: 'B', value: 50 },
  { label: 'C', value: 120 },
  { label: 'D', value: 200 },
  { label: 'E', value: 65 },
]);
```

## Key Takeaways

- **`initialize()`** sets up the DOM structure, config properties, and layer definitions once.
- **`preDraw()`** updates scales based on the incoming data before each draw.
- **Layer events** handle the D3 enter/update/merge/exit pattern declaratively.
- **Transitions** are defined with `:transition` event variants and are automatically awaited.
- **Config** makes the chart reusable with `chart.config('width', 800).draw(data)`.
