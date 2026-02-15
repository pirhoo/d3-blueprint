# Labeled Bubble Chart

A bubble chart with text labels inside each circle. Builds on the basic [Bubble Chart](./bubble-chart) by using `<g>` groups that contain both a `<circle>` and `<text>` elements. Labels are conditionally shown based on circle radius to avoid visual clutter.

## Live Preview

<ClientOnly>
  <LabeledBubbleChartDemo />
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
const COLORS = ['steelblue', '#e45858', '#50a060', '#e8a838'];
const GROUPS = ['Web', 'Data', 'Enterprise', 'Systems'];
const fmt = format(',d');

class LabeledBubbleChart extends D3Blueprint {
  initialize() {
    this.colorScale = scaleOrdinal().domain(GROUPS).range(COLORS);
    this.packLayout = pack().size([WIDTH - 2, HEIGHT - 2]).padding(3);

    this.chart = this.base.append('g').attr('transform', 'translate(1,1)');

    const nodesGroup = this.chart.append('g').attr('class', 'nodes');

    this.layer('nodes', nodesGroup, {
      dataBind: (selection, data) => {
        const root = this.packLayout(
          hierarchy({ children: data }).sum((d) => d.value),
        );
        return selection.selectAll('g').data(root.leaves(), (d) => d.data.name);
      },
      insert: (selection) => {
        const g = selection.append('g');
        g.append('circle');
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '-0.2em')
          .attr('font-size', '10px')
          .attr('pointer-events', 'none');
        g.append('text')
          .attr('class', 'value-label')
          .attr('text-anchor', 'middle')
          .attr('dy', '1em')
          .attr('font-size', '9px')
          .attr('pointer-events', 'none');
        return g;
      },
      events: {
        merge: (selection) => {
          selection
            .select('text:not(.value-label)')
            .text((d) => (d.r > 20 ? d.data.name : ''));
          selection
            .select('.value-label')
            .text((d) => (d.r > 25 ? fmt(d.data.value) : ''));
        },
        'merge:transition': (transition) => {
          transition.duration(800)
            .attr('transform', (d) => `translate(${d.x},${d.y})`);
          transition.select('circle')
            .attr('r', (d) => d.r)
            .attr('fill', (d) => this.colorScale(d.data.group))
            .attr('fill-opacity', 0.7);
        },
        'exit:transition': (transition) => {
          transition.duration(300).attr('opacity', 0).remove();
        },
      },
    });

    this.use(tooltipPlugin(this.chart, (chart, tooltip) => {
      chart.chart.selectAll('.nodes g')
        .on('mouseenter', function (event, d) {
          select(this).select('circle').attr('fill-opacity', 1);
          tooltip.show(d.x, d.y, `${d.data.name}: ${fmt(d.data.value)}`);
        })
        .on('mouseleave', function () {
          select(this).select('circle').attr('fill-opacity', 0.7);
          tooltip.hide();
        });
    }));
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new LabeledBubbleChart(
  select('#chart').append('svg').attr('width', 500).attr('height', 500),
);

await chart.draw([
  { name: 'JavaScript', group: 'Web', value: 92 },
  { name: 'Python', group: 'Data', value: 78 },
  { name: 'Rust', group: 'Systems', value: 34 },
]);
```

## Key Takeaways

- **Composite `<g>` elements**: each data point is a group containing a circle and text labels, bound as a single layer item.
- **Conditional labels**: labels are only shown when the circle radius exceeds a threshold (`d.r > 20`), preventing text from overflowing small bubbles.
- **Two-line labels**: the name and value are separate `<text>` elements offset with `dy`, giving a clean stacked layout inside each circle.
- **`pointer-events: none` on text**: ensures hover events pass through labels to the circle beneath, so tooltips work consistently.
- **Transition on `transform`**: moving the entire `<g>` group via `translate()` keeps circle and text in sync during animations.
