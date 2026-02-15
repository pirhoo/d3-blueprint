<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleLinear, scalePoint, scaleOrdinal } from 'd3-scale';
import { min, max } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 400;
const HEIGHT = 360;
const MARGIN = { top: 30, right: 60, bottom: 30, left: 60 };
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060', '#e8a838', '#7c6bbf'];

class SlopeChart extends D3Blueprint {
  initialize() {
    this.xScale = scalePoint();
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().range(COLORS);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    // Layer 1: connecting lines
    const linesGroup = this.chart.append('g').attr('class', 'lines');

    this.layer('lines', linesGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('line').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('line'),
      events: {
        enter: (selection) => {
          selection
            .attr('x1', this.xScale('Before'))
            .attr('x2', this.xScale('After'))
            .attr('y1', (d) => this.yScale(d.before))
            .attr('y2', (d) => this.yScale(d.after))
            .attr('stroke', (d) => this.colorScale(d.label))
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0);
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('stroke-opacity', 0.8);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('stroke-opacity', 0.8)
            .attr('y1', (d) => this.yScale(d.before))
            .attr('y2', (d) => this.yScale(d.after))
            .attr('stroke', (d) => this.colorScale(d.label));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('stroke-opacity', 0).remove();
        },
      },
    });

    // Layer 2: left dots
    const leftDotsGroup = this.chart.append('g').attr('class', 'left-dots');

    this.layer('left-dots', leftDotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', this.xScale('Before'))
            .attr('cy', (d) => this.yScale(d.before))
            .attr('r', 0)
            .attr('fill', (d) => this.colorScale(d.label));
        },
        'enter:transition': (transition) => {
          transition.duration(400).attr('r', 5);
        },
        'merge:transition': (transition) => {
          transition.duration(600).attr('r', 5).attr('cy', (d) => this.yScale(d.before));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Layer 3: right dots
    const rightDotsGroup = this.chart.append('g').attr('class', 'right-dots');

    this.layer('right-dots', rightDotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', this.xScale('After'))
            .attr('cy', (d) => this.yScale(d.after))
            .attr('r', 0)
            .attr('fill', (d) => this.colorScale(d.label));
        },
        'enter:transition': (transition) => {
          transition.duration(400).attr('r', 5);
        },
        'merge:transition': (transition) => {
          transition.duration(600).attr('r', 5).attr('cy', (d) => this.yScale(d.after));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Layer 4: labels on the right side
    const labelsGroup = this.chart.append('g').attr('class', 'labels');

    this.layer('labels', labelsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('text').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('text'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', this.xScale('After') + 10)
            .attr('y', (d) => this.yScale(d.after))
            .attr('dy', '0.35em')
            .attr('font-size', '11px')
            .attr('fill', (d) => this.colorScale(d.label))
            .text((d) => d.label);
        },
        'merge:transition': (transition) => {
          transition.duration(600).attr('y', (d) => this.yScale(d.after));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Column headers
    this.chart.append('text')
      .attr('x', 0).attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', 'var(--vp-c-text-2)')
      .text('Before');

    this.chart.append('text')
      .attr('x', innerWidth).attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', 'var(--vp-c-text-2)')
      .text('After');

    this.use(tooltipPlugin(this.chart, (chart, tooltip) => {
        chart.chart.selectAll('.left-dots circle, .right-dots circle')
          .on('mouseenter', function (event, d) {
            select(this).attr('r', 7);
            const isLeft = select(this.parentNode).classed('left-dots');
            const val = isLeft ? d.before : d.after;
            const side = isLeft ? 'Before' : 'After';
            tooltip.show(
              chart.xScale(side),
              chart.yScale(val),
              [{ text: d.label }, { text: `${side}: ${val}` }],
            );
          })
          .on('mouseleave', function () {
            select(this).attr('r', 5);
            tooltip.hide();
          });
      }
    ));
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const allValues = data.flatMap((d) => [d.before, d.after]);
    this.xScale.domain(['Before', 'After']).range([0, innerWidth]);
    this.yScale.domain([min(allValues) * 0.9, max(allValues) * 1.1]).range([innerHeight, 0]);
    this.colorScale.domain(data.map((d) => d.label));
  }
}

const datasets = [
  [
    { label: 'Product A', before: 45, after: 72 },
    { label: 'Product B', before: 60, after: 48 },
    { label: 'Product C', before: 35, after: 65 },
    { label: 'Product D', before: 80, after: 82 },
    { label: 'Product E', before: 55, after: 40 },
  ],
  [
    { label: 'Product A', before: 50, after: 68 },
    { label: 'Product B', before: 55, after: 55 },
    { label: 'Product C', before: 40, after: 75 },
    { label: 'Product D', before: 70, after: 60 },
    { label: 'Product E', before: 65, after: 70 },
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

  chart = new SlopeChart(svg);
  chart.draw(datasets[0]);

  intervalId = setInterval(() => {
    datasetIndex = (datasetIndex + 1) % datasets.length;
    chart?.draw(datasets[datasetIndex]);
  }, 3500);
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
      Live preview: data cycles every 3.5 s
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
