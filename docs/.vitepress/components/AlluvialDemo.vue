<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 500;
const HEIGHT = 400;
const MARGIN = { top: 20, right: 120, bottom: 20, left: 120 };
const NODE_WIDTH = 16;
const NODE_PAD = 8;
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060', '#e8a838'];

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
            .attr('fill', (d) => d.side === 'source' ? this.colorScale(d.name) : 'var(--vp-c-text-3)')
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
            .attr('height', (d) => d.height)
            .attr('fill', (d) => d.side === 'source' ? this.colorScale(d.name) : 'var(--vp-c-text-3)');
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer 3: labels
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
            .attr('fill', 'var(--vp-c-text-2)')
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

    this.usePlugin(tooltipPlugin(this.chart, (chart, tooltip) => {
        chart.chart.selectAll('.links path')
          .on('mouseenter', function (event, d) {
            select(this).attr('fill-opacity', 0.7);
            const midX = (d.x0 + d.x1) / 2;
            const midY = (d.y0 + d.y0b + d.y1 + d.y1b) / 4;
            tooltip.show(midX, midY, [
              { text: `${d.source} \u2192 ${d.target}` },
              { text: `Flow: ${d.value}` },
            ]);
          })
          .on('mouseleave', function () {
            select(this).attr('fill-opacity', 0.4);
            tooltip.hide();
          });
      }
    ));
  }

  ribbonPath(d) {
    const cx = (d.x0 + d.x1) / 2;
    return `M${d.x0},${d.y0} C${cx},${d.y0} ${cx},${d.y1} ${d.x1},${d.y1} L${d.x1},${d.y1b} C${cx},${d.y1b} ${cx},${d.y0b} ${d.x0},${d.y0b} Z`;
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    // Compute source and target totals
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

    // Available height after subtracting padding between nodes
    const maxSlots = Math.max(sources.length, targets.length) - 1;
    const availableHeight = innerHeight - maxSlots * NODE_PAD;

    // Source node positions
    let sy = 0;
    const sourceNodes = sources.map((name) => {
      const h = (sourceTotals[name] / totalFlow) * availableHeight;
      const node = { name, side: 'source', x: 0, y: sy, height: h };
      sy += h + NODE_PAD;
      return node;
    });

    // Center source column vertically
    const sourceOffset = (innerHeight - (sy - NODE_PAD)) / 2;
    sourceNodes.forEach((n) => { n.y += sourceOffset; });

    // Target node positions
    let ty = 0;
    const targetNodes = targets.map((name) => {
      const h = (targetTotals[name] / totalFlow) * availableHeight;
      const node = { name, side: 'target', x: innerWidth - NODE_WIDTH, y: ty, height: h };
      ty += h + NODE_PAD;
      return node;
    });

    // Center target column vertically
    const targetOffset = (innerHeight - (ty - NODE_PAD)) / 2;
    targetNodes.forEach((n) => { n.y += targetOffset; });

    this.computedNodes = [...sourceNodes, ...targetNodes];

    // Compute link ribbon positions
    const sOffsets = {};
    sources.forEach((s) => { sOffsets[s] = 0; });
    const tOffsets = {};
    targets.forEach((t) => { tOffsets[t] = 0; });

    this.computedLinks = data.map((d) => {
      const sNode = sourceNodes.find((n) => n.name === d.source);
      const tNode = targetNodes.find((n) => n.name === d.target);
      const linkH = (d.value / totalFlow) * availableHeight;

      const y0 = sNode.y + sOffsets[d.source];
      const y1 = tNode.y + tOffsets[d.target];
      sOffsets[d.source] += linkH;
      tOffsets[d.target] += linkH;

      return {
        source: d.source,
        target: d.target,
        value: d.value,
        x0: NODE_WIDTH,
        x1: innerWidth - NODE_WIDTH,
        y0,
        y0b: y0 + linkH,
        y1,
        y1b: y1 + linkH,
      };
    });
  }
}

const datasets = [
  [
    { source: 'Solar', target: 'Heating', value: 20 },
    { source: 'Solar', target: 'Lighting', value: 15 },
    { source: 'Wind', target: 'Industry', value: 25 },
    { source: 'Wind', target: 'Transport', value: 10 },
    { source: 'Hydro', target: 'Industry', value: 18 },
    { source: 'Hydro', target: 'Heating', value: 12 },
    { source: 'Gas', target: 'Heating', value: 30 },
    { source: 'Gas', target: 'Transport', value: 22 },
  ],
  [
    { source: 'Solar', target: 'Heating', value: 28 },
    { source: 'Solar', target: 'Lighting', value: 22 },
    { source: 'Wind', target: 'Industry', value: 30 },
    { source: 'Wind', target: 'Transport', value: 18 },
    { source: 'Hydro', target: 'Industry', value: 14 },
    { source: 'Hydro', target: 'Heating', value: 8 },
    { source: 'Gas', target: 'Heating', value: 20 },
    { source: 'Gas', target: 'Transport', value: 16 },
  ],
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

  chart = new AlluvialDiagram(svg);
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
