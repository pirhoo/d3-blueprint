# Arc Diagram

An arc diagram showing team collaborations as semicircular arcs above a horizontal baseline. Nodes are arranged along the baseline using `scalePoint`, colored by department, with arc stroke width encoding collaboration strength.

## Live Preview

<ClientOnly>
  <ArcDiagramDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scalePoint, scaleOrdinal, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { Tooltip } from './charts/Tooltip.js';

const WIDTH = 500;
const HEIGHT = 360;
const MARGIN = { top: 40, right: 30, bottom: 80, left: 30 };
const COLORS = ['steelblue', '#e45858', '#50a060', '#e8a838', '#7c6bbf'];

class ArcDiagram extends D3Blueprint {
  initialize() {
    this.xScale = scalePoint();
    this.colorScale = scaleOrdinal();
    this.strokeScale = scaleLinear();

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    this.baselineY = innerHeight - 40;

    // Layer 1: semicircular arc paths
    const arcsGroup = this.chart.append('g').attr('class', 'arcs');

    this.layer('arcs', arcsGroup, {
      dataBind: (selection) => {
        return selection.selectAll('path').data(this.computedArcs, (d) => `${d.source}-${d.target}`);
      },
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('d', (d) => this.arcPath(d))
            .attr('fill', 'none')
            .attr('stroke', (d) => this.colorScale(d.sourceDept))
            .attr('stroke-width', (d) => this.strokeScale(d.strength))
            .attr('stroke-opacity', 0);
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('stroke-opacity', 0.5);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('stroke-opacity', 0.5)
            .attr('d', (d) => this.arcPath(d))
            .attr('stroke', (d) => this.colorScale(d.sourceDept))
            .attr('stroke-width', (d) => this.strokeScale(d.strength));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('stroke-opacity', 0).remove();
        },
      },
    });

    // Layer 2: node circles along the baseline
    const nodesGroup = this.chart.append('g').attr('class', 'nodes');

    this.layer('nodes', nodesGroup, {
      dataBind: (selection) => {
        return selection.selectAll('circle').data(this.computedNodeData, (d) => d.name);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => this.xScale(d.name))
            .attr('cy', this.baselineY)
            .attr('r', 0)
            .attr('fill', (d) => this.colorScale(d.dept))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        },
        'enter:transition': (transition) => {
          transition.duration(400).attr('r', 6);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('r', 6)
            .attr('cx', (d) => this.xScale(d.name))
            .attr('fill', (d) => this.colorScale(d.dept));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Layer 3: rotated labels below nodes
    const labelsGroup = this.chart.append('g').attr('class', 'labels');

    this.layer('labels', labelsGroup, {
      dataBind: (selection) => {
        return selection.selectAll('text').data(this.computedNodeData, (d) => d.name);
      },
      insert: (selection) => selection.append('text'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(d.name))
            .attr('y', this.baselineY + 16)
            .attr('text-anchor', 'start')
            .attr('font-size', '10px')
            .attr('transform', (d) =>
              `rotate(45, ${this.xScale(d.name)}, ${this.baselineY + 16})`)
            .text((d) => d.name);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x', (d) => this.xScale(d.name))
            .attr('transform', (d) =>
              `rotate(45, ${this.xScale(d.name)}, ${this.baselineY + 16})`);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    this.tooltip = new Tooltip(this.chart, { width: innerWidth, height: innerHeight });
  }

  arcPath(d) {
    const x1 = this.xScale(d.source);
    const x2 = this.xScale(d.target);
    const rx = Math.abs(x2 - x1) / 2;
    const ry = Math.min(rx, this.baselineY - 5);
    const y = this.baselineY;
    const sweep = x1 < x2 ? 1 : 0;
    return `M${x1},${y} A${rx},${ry} 0 0,${sweep} ${x2},${y}`;
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const { nodes, links } = data;

    this.xScale.domain(nodes.map((n) => n.name)).range([0, innerWidth]).padding(0.5);

    const depts = [...new Set(nodes.map((n) => n.dept))];
    this.colorScale.domain(depts).range(COLORS.slice(0, depts.length));

    const maxStrength = max(links, (d) => d.strength) || 1;
    this.strokeScale.domain([1, maxStrength]).range([1.5, 6]);

    const deptMap = {};
    nodes.forEach((n) => { deptMap[n.name] = n.dept; });

    this.computedNodeData = nodes;
    this.computedArcs = links.map((d) => ({
      ...d,
      sourceDept: deptMap[d.source],
    }));
  }

  postDraw() {
    const tooltip = this.tooltip;
    const xScale = this.xScale;
    const baselineY = this.baselineY;

    this.chart.selectAll('.arcs path')
      .on('mouseenter', function (event, d) {
        select(this).attr('stroke-opacity', 0.9);
        const midX = (xScale(d.source) + xScale(d.target)) / 2;
        const arcH = Math.min(Math.abs(xScale(d.target) - xScale(d.source)) / 2, baselineY - 5);
        tooltip.show(midX, baselineY - arcH, [
          { text: `${d.source} ↔ ${d.target}` },
          { text: `Strength: ${d.strength}` },
        ]);
      })
      .on('mouseleave', function () {
        select(this).attr('stroke-opacity', 0.5);
        tooltip.hide();
      });

    this.chart.selectAll('.nodes circle')
      .on('mouseenter', function (event, d) {
        select(this).attr('r', 9);
        tooltip.show(xScale(d.name), baselineY, [
          { text: d.name },
          { text: d.dept },
        ]);
      })
      .on('mouseleave', function () {
        select(this).attr('r', 6);
        tooltip.hide();
      });
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new ArcDiagram(
  select('#chart').append('svg').attr('width', 500).attr('height', 360),
);

await chart.draw({
  nodes: [
    { name: 'Alice', dept: 'Engineering' },
    { name: 'Bob', dept: 'Engineering' },
    { name: 'Carol', dept: 'Design' },
    { name: 'Dave', dept: 'Design' },
    { name: 'Eve', dept: 'Product' },
    { name: 'Frank', dept: 'Product' },
  ],
  links: [
    { source: 'Alice', target: 'Bob', strength: 8 },
    { source: 'Alice', target: 'Carol', strength: 4 },
    { source: 'Bob', target: 'Dave', strength: 3 },
    { source: 'Carol', target: 'Eve', strength: 6 },
    { source: 'Dave', target: 'Frank', strength: 5 },
    { source: 'Eve', target: 'Frank', strength: 7 },
  ],
});
```

## Key Takeaways

- **`scalePoint` for node placement**: nodes are evenly spaced along a horizontal baseline, with padding to keep them away from the edges.
- **SVG arc commands for semicircles**: `M x1,y A rx,ry 0 0,sweep x2,y` draws a semicircular arc between two nodes, with the radius equal to half the horizontal distance.
- **Stroke width encodes strength**: `scaleLinear` maps link strength values to stroke widths, making stronger collaborations visually thicker.
- **Department-colored nodes**: `scaleOrdinal` assigns colors by department so team structure is visible at a glance.
- **Arc height encodes distance**: nodes that are farther apart produce taller arcs, revealing the network's long-range connections.
- **No AxisChart needed**: the baseline replaces a traditional x-axis, and there is no y-axis since arc height is derived from node spacing.
