# Alluvial Diagram

An alluvial (Sankey-style) diagram showing flows between energy sources and end uses. No AxisChart is needed because this chart computes its own node positions proportional to flow volume and draws cubic-bezier ribbon paths between source and target columns.

## Live Preview

<ClientOnly>
  <AlluvialDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleOrdinal } from 'd3-scale';
import { Tooltip } from './charts/Tooltip.js';

const WIDTH = 500;
const HEIGHT = 400;
const MARGIN = { top: 20, right: 120, bottom: 20, left: 120 };
const NODE_WIDTH = 16;
const NODE_PAD = 8;
const COLORS = ['steelblue', '#e45858', '#50a060', '#e8a838'];

class AlluvialDiagram extends D3Blueprint {
  initialize() {
    this.colorScale = scaleOrdinal().range(COLORS);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    // Layer 1: link ribbons
    const linksGroup = this.chart.append('g').attr('class', 'links');

    this.layer('links', linksGroup, {
      dataBind: (selection) => {
        return selection.selectAll('path').data(this.computedLinks, (d) => `${d.source}-${d.target}`);
      },
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('d', (d) => this.ribbonPath(d))
            .attr('fill', (d) => this.colorScale(d.source))
            .attr('fill-opacity', 0)
            .attr('stroke', 'none');
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('fill-opacity', 0.4);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('fill-opacity', 0.4)
            .attr('d', (d) => this.ribbonPath(d))
            .attr('fill', (d) => this.colorScale(d.source));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('fill-opacity', 0).remove();
        },
      },
    });

    // Layer 2: nodes (source + target rects)
    const nodesGroup = this.chart.append('g').attr('class', 'nodes');

    this.layer('nodes', nodesGroup, {
      dataBind: (selection) => {
        return selection.selectAll('rect').data(this.computedNodes, (d) => `${d.side}-${d.name}`);
      },
      insert: (selection) => selection.append('rect'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('width', NODE_WIDTH)
            .attr('height', (d) => d.height)
            .attr('fill', (d) => d.side === 'source' ? this.colorScale(d.name) : '#999')
            .attr('rx', 2)
            .attr('opacity', 0);
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('opacity', 1);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('opacity', 1)
            .attr('y', (d) => d.y)
            .attr('height', (d) => d.height);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer 3: labels beside each node
    const labelsGroup = this.chart.append('g').attr('class', 'labels');

    this.layer('labels', labelsGroup, {
      dataBind: (selection) => {
        return selection.selectAll('text').data(this.computedNodes, (d) => `${d.side}-${d.name}`);
      },
      insert: (selection) => selection.append('text'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => d.side === 'source' ? d.x - 6 : d.x + NODE_WIDTH + 6)
            .attr('y', (d) => d.y + d.height / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', (d) => d.side === 'source' ? 'end' : 'start')
            .attr('font-size', '11px')
            .text((d) => d.name);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('y', (d) => d.y + d.height / 2);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    this.tooltip = new Tooltip(this.chart, { width: innerWidth, height: innerHeight });
  }

  ribbonPath(d) {
    const cx = (d.x0 + d.x1) / 2;
    return `M${d.x0},${d.y0} C${cx},${d.y0} ${cx},${d.y1} ${d.x1},${d.y1} ` +
      `L${d.x1},${d.y1b} C${cx},${d.y1b} ${cx},${d.y0b} ${d.x0},${d.y0b} Z`;
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const sourceTotals = {};
    const targetTotals = {};
    data.forEach((d) => {
      sourceTotals[d.source] = (sourceTotals[d.source] || 0) + d.value;
      targetTotals[d.target] = (targetTotals[d.target] || 0) + d.value;
    });

    const sources = Object.keys(sourceTotals);
    const targets = Object.keys(targetTotals);
    const totalFlow = Object.values(sourceTotals).reduce((a, b) => a + b, 0);
    this.colorScale.domain(sources);

    const maxSlots = Math.max(sources.length, targets.length) - 1;
    const availableHeight = innerHeight - maxSlots * NODE_PAD;

    // Build source and target node arrays with y positions ...
    // Compute link ribbon coordinates ...
    // (see live demo source for full layout logic)
  }

  postDraw() {
    const tooltip = this.tooltip;
    this.chart.selectAll('.links path')
      .on('mouseenter', function (event, d) {
        select(this).attr('fill-opacity', 0.7);
        tooltip.show((d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2, [
          { text: `${d.source} → ${d.target}` },
          { text: `Flow: ${d.value}` },
        ]);
      })
      .on('mouseleave', function () {
        select(this).attr('fill-opacity', 0.4);
        tooltip.hide();
      });
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new AlluvialDiagram(
  select('#chart').append('svg').attr('width', 500).attr('height', 400),
);

await chart.draw([
  { source: 'Solar', target: 'Heating', value: 20 },
  { source: 'Solar', target: 'Lighting', value: 15 },
  { source: 'Wind', target: 'Industry', value: 25 },
  { source: 'Wind', target: 'Transport', value: 10 },
  { source: 'Hydro', target: 'Industry', value: 18 },
  { source: 'Hydro', target: 'Heating', value: 12 },
  { source: 'Gas', target: 'Heating', value: 30 },
  { source: 'Gas', target: 'Transport', value: 22 },
]);
```

## Key Takeaways

- **Custom layout in `preDraw()`**: node heights are proportional to total flow, and link ribbon coordinates are accumulated per-node so they stack without overlap.
- **Cubic-bezier ribbons**: each link is a closed `<path>` with two cubic bezier curves (top and bottom edges), creating the signature alluvial "flow" shape.
- **Computed data in `dataBind`**: unlike axis-based charts where scales transform raw values, alluvial layouts pre-compute all pixel positions and store them on the chart instance for each layer to consume.
- **Source-colored ribbons**: links inherit their source node's color with reduced opacity, making it easy to trace where energy originates.
- **No AxisChart needed**: the two-column layout with proportional node sizing replaces traditional axes entirely.
