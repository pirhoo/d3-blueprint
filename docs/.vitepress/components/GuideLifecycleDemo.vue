<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

const WIDTH = 380;
const HEIGHT = 240;
const MARGIN = { top: 24, right: 16, bottom: 28, left: 32 };

class LifecycleChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleBand().padding(0.2);
    this.yScale = scaleLinear();

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const barsGroup = this.chart.append('g').attr('class', 'bars');

    this.layer('bars', barsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('rect').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('rect'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(d.label))
            .attr('width', this.xScale.bandwidth())
            .attr('y', innerHeight)
            .attr('height', 0)
            .attr('fill', 'var(--vp-c-brand-1)')
            .attr('rx', 3);
        },
        'enter:transition': (transition) => {
          transition
            .duration(600)
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => innerHeight - this.yScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => innerHeight - this.yScale(d.value))
            .attr('x', (d) => this.xScale(d.label))
            .attr('width', this.xScale.bandwidth())
            .attr('fill', 'var(--vp-c-brand-1)');
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('height', 0).attr('y', innerHeight).remove();
        },
      },
    });

    const labelsGroup = this.chart.append('g').attr('class', 'labels');

    this.layer('labels', labelsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('text').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('text'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('y', innerHeight + 16)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('fill', 'var(--vp-c-text-2)')
            .text((d) => d.label);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Highlight dot added in postDraw
    this.highlight = this.chart.append('circle')
      .attr('r', 0)
      .attr('fill', '#e45858')
      .attr('stroke', 'var(--vp-c-bg-soft)')
      .attr('stroke-width', 2);
  }

  transform(data) {
    // Sort ascending by value. Demonstrates the transform phase
    return [...data].sort((a, b) => a.value - b.value);
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    this.xScale.domain(data.map((d) => d.label)).range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.value) * 1.1]).range([innerHeight, 0]);
  }

  postDraw(data) {
    // Highlight bar C. Demonstrates the postDraw phase
    const item = data.find((d) => d.label === 'C');
    this.highlight
      .transition()
      .duration(600)
      .attr('cx', this.xScale(item.label) + this.xScale.bandwidth() / 2)
      .attr('cy', this.yScale(item.value) - 10)
      .attr('r', 5);
  }
}

const datasets = [
  [
    { label: 'A', value: 30 },
    { label: 'B', value: 65 },
    { label: 'C', value: 45 },
    { label: 'D', value: 80 },
    { label: 'E', value: 20 },
  ],
  [
    { label: 'A', value: 50 },
    { label: 'B', value: 35 },
    { label: 'C', value: 70 },
    { label: 'D', value: 40 },
    { label: 'E', value: 60 },
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

  chart = new LifecycleChart(svg);
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
      <code>transform()</code> sorts bars · <code>postDraw()</code> highlights C
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
