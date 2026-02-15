<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scalePoint, scaleOrdinal, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { Tooltip } from '../plugins/Tooltip.js';

const WIDTH = 500;
const HEIGHT = 360;
const MARGIN = { top: 40, right: 30, bottom: 80, left: 30 };
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060', '#e8a838', '#7c6bbf'];

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

    // Layer 1: arc paths
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

    // Layer 2: node circles along baseline
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
            .attr('stroke', 'var(--vp-c-bg-soft)')
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

    // Layer 3: labels below nodes, rotated 45 degrees
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
            .attr('fill', 'var(--vp-c-text-2)')
            .attr('transform', (d) => `rotate(45, ${this.xScale(d.name)}, ${this.baselineY + 16})`)
            .text((d) => d.name);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x', (d) => this.xScale(d.name))
            .attr('transform', (d) => `rotate(45, ${this.xScale(d.name)}, ${this.baselineY + 16})`);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    this.usePlugin(new Tooltip(this.chart, (chart, tooltip) => {
        chart.chart.selectAll('.arcs path')
          .on('mouseenter', function (event, d) {
            select(this).attr('stroke-opacity', 0.9);
            const x1 = chart.xScale(d.source);
            const x2 = chart.xScale(d.target);
            const midX = (x1 + x2) / 2;
            const arcH = Math.min(Math.abs(x2 - x1) / 2, chart.baselineY - 5);
            tooltip.show(midX, chart.baselineY - arcH, [
              { text: `${d.source} \u2194 ${d.target}` },
              { text: `Strength: ${d.strength}` },
            ]);
          })
          .on('mouseleave', function () {
            select(this).attr('stroke-opacity', 0.5);
            tooltip.hide();
          });

        chart.chart.selectAll('.nodes circle')
          .on('mouseenter', function (event, d) {
            select(this).attr('r', 9);
            tooltip.show(chart.xScale(d.name), chart.baselineY, [
              { text: d.name },
              { text: d.dept },
            ]);
          })
          .on('mouseleave', function () {
            select(this).attr('r', 6);
            tooltip.hide();
          });
      }
    ));
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

    // Build color scale from departments
    const depts = [...new Set(nodes.map((n) => n.dept))];
    this.colorScale.domain(depts).range(COLORS.slice(0, depts.length));

    // Stroke width scale based on link strength
    const maxStrength = max(links, (d) => d.strength) || 1;
    this.strokeScale.domain([1, maxStrength]).range([1.5, 6]);

    // Create department lookup
    const deptMap = {};
    nodes.forEach((n) => { deptMap[n.name] = n.dept; });

    this.computedNodeData = nodes;
    this.computedArcs = links.map((d) => ({
      ...d,
      sourceDept: deptMap[d.source],
      targetDept: deptMap[d.target],
    }));
  }
}

const datasets = [
  {
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
      { source: 'Alice', target: 'Eve', strength: 2 },
    ],
  },
  {
    nodes: [
      { name: 'Alice', dept: 'Engineering' },
      { name: 'Bob', dept: 'Engineering' },
      { name: 'Carol', dept: 'Design' },
      { name: 'Dave', dept: 'Design' },
      { name: 'Eve', dept: 'Product' },
      { name: 'Frank', dept: 'Product' },
    ],
    links: [
      { source: 'Alice', target: 'Bob', strength: 5 },
      { source: 'Alice', target: 'Dave', strength: 6 },
      { source: 'Bob', target: 'Carol', strength: 7 },
      { source: 'Carol', target: 'Frank', strength: 4 },
      { source: 'Dave', target: 'Eve', strength: 8 },
      { source: 'Eve', target: 'Frank', strength: 3 },
      { source: 'Bob', target: 'Eve', strength: 5 },
    ],
  },
];

const container = ref(null);
let chart = null;
let datasetIndex = 0;
let intervalId;

onMounted(() => {
  if (!container.value) return;

  const svg = select(container.value)
    .append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .style('max-width', '100%')
    .style('height', 'auto');

  chart = new ArcDiagram(svg);
  chart.draw(datasets[0]);

  intervalId = setInterval(() => {
    datasetIndex = (datasetIndex + 1) % datasets.length;
    chart?.draw(datasets[datasetIndex]);
  }, 4000);
});

onUnmounted(() => {
  clearInterval(intervalId);
  chart?.destroy();
});
</script>

<template>
  <div class="chart-demo">
    <div ref="container" class="chart-demo__container" />
    <p class="chart-demo__caption">
      Live preview: data cycles every 4 s
    </p>
  </div>
</template>

<style scoped lang="scss">
.chart-demo {
  margin: 24px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;

  &__container {
    padding: 16px;
    display: flex;
    justify-content: center;
    background: var(--vp-c-bg-soft);

    :deep(svg) {
      font-family: var(--vp-font-family-base);
      font-size: 12px;
    }
  }

  &__caption {
    margin: 0;
    padding: 8px 16px;
    font-size: 13px;
    color: var(--vp-c-text-3);
    border-top: 1px solid var(--vp-c-divider);
    text-align: center;
  }
}
</style>
