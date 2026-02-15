# Bubble Chart

A circle-packing bubble chart using `d3-hierarchy`'s `pack()` layout. Each circle's area is proportional to its value, and color encodes the group. No axes are needed — the layout algorithm positions circles to minimize wasted space.

## Live Preview

<ClientOnly>
  <BubbleChartDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { pack, hierarchy } from 'd3-hierarchy';
import { format } from 'd3-format';
import { D3Blueprint } from 'd3-blueprint';
import { tooltipPlugin } from './plugins/tooltipPlugin.js';

const WIDTH = 500;
const HEIGHT = 500;
const COLORS = ['steelblue', '#e45858', '#50a060', '#e8a838', '#7c6bbf'];
const GROUPS = ['Engineering', 'Design', 'Marketing', 'Sales', 'Support'];
const fmt = format(',d');

class BubbleChart extends D3Blueprint {
  initialize() {
    this.colorScale = scaleOrdinal().domain(GROUPS).range(COLORS);
    this.packLayout = pack().size([WIDTH - 2, HEIGHT - 2]).padding(3);

    this.chart = this.base.append('g').attr('transform', 'translate(1,1)');

    const bubblesGroup = this.chart.append('g').attr('class', 'bubbles');

    this.layer('bubbles', bubblesGroup, {
      dataBind: (selection, data) => {
        const root = this.packLayout(
          hierarchy({ children: data }).sum((d) => d.value),
        );
        return selection.selectAll('circle').data(root.leaves(), (d) => d.data.name);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y)
            .attr('r', 0)
            .attr('fill', (d) => this.colorScale(d.data.group))
            .attr('fill-opacity', 0.7);
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y)
            .attr('r', (d) => d.r)
            .attr('fill', (d) => this.colorScale(d.data.group));
        },
        'exit:transition': (transition) => {
          transition.duration(300).attr('r', 0).remove();
        },
      },
    });

    this.use(tooltipPlugin(this.chart, (chart, tooltip) => {
      chart.chart.selectAll('.bubbles circle')
        .on('mouseenter', function (event, d) {
          select(this).attr('fill-opacity', 1);
          tooltip.show(d.x, d.y, `${d.data.name}: ${fmt(d.data.value)}`);
        })
        .on('mouseleave', function () {
          select(this).attr('fill-opacity', 0.7);
          tooltip.hide();
        });
    }));
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new BubbleChart(
  select('#chart').append('svg').attr('width', 500).attr('height', 500),
);

await chart.draw([
  { name: 'Alice', group: 'Engineering', value: 85 },
  { name: 'Bob', group: 'Design', value: 42 },
  { name: 'Carol', group: 'Marketing', value: 63 },
]);

// Update: circles animate to new positions and sizes
await chart.draw(newData);
```

## Key Takeaways

- **`pack()` computes positions and radii**: the circle-packing layout takes a hierarchy and produces `x`, `y`, `r` for each leaf node.
- **`hierarchy({ children: data })`**: wraps a flat array into a single-level hierarchy that `pack()` can process.
- **No axes needed**: the layout fills the available space organically — positions are determined by the algorithm, not by scales.
- **Enter from zero radius**: new circles appear by animating `r` from 0, creating a smooth "grow in" effect on data changes.
- **Color encodes group**: an ordinal color scale maps each item's group to a distinct color for visual clustering.
