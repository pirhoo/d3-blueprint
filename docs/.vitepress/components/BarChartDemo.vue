<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { max } from 'd3-array';
import 'd3-transition';
import { D3Compose } from 'd3compose';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };

class BarChart extends D3Compose {
  initialize() {
    this.xScale = scaleBand().padding(0.1);
    this.yScale = scaleLinear();
    this.innerWidth = 0;
    this.innerHeight = 0;

    this.configDefine('width', { defaultValue: WIDTH });
    this.configDefine('height', { defaultValue: HEIGHT });
    this.configDefine('margin', { defaultValue: MARGIN });

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
            .attr('fill', 'var(--vp-c-brand-1)');
        },
        'enter:transition': (transition) => {
          transition
            .duration(750)
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => this.innerHeight - this.yScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(750)
            .attr('x', (d) => this.xScale(d.label))
            .attr('width', this.xScale.bandwidth())
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => this.innerHeight - this.yScale(d.value));
        },
        'exit:transition': (transition) => {
          transition.duration(300).attr('opacity', 0).remove();
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

    this.xScale.domain(data.map((d) => d.label)).range([0, this.innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.value) ?? 0]).range([this.innerHeight, 0]);

    this.xAxisGroup
      .attr('transform', `translate(0,${this.innerHeight})`)
      .transition()
      .duration(750)
      .call(axisBottom(this.xScale));

    this.yAxisGroup.transition().duration(750).call(axisLeft(this.yScale));
  }
}

const datasets = [
  [
    { label: 'A', value: 30 },
    { label: 'B', value: 86 },
    { label: 'C', value: 168 },
    { label: 'D', value: 47 },
  ],
  [
    { label: 'A', value: 80 },
    { label: 'B', value: 50 },
    { label: 'C', value: 120 },
    { label: 'D', value: 200 },
    { label: 'E', value: 65 },
  ],
  [
    { label: 'B', value: 140 },
    { label: 'C', value: 10 },
    { label: 'D', value: 90 },
    { label: 'E', value: 175 },
    { label: 'F', value: 60 },
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

  chart = new BarChart(svg);
  chart.draw(datasets[0]);

  intervalId = setInterval(() => {
    datasetIndex = (datasetIndex + 1) % datasets.length;
    chart?.draw(datasets[datasetIndex]);
  }, 2500);
});

onUnmounted(() => {
  clearInterval(intervalId);
  chart?.destroy();
});
</script>

<template>
  <div class="chart-demo">
    <div ref="container" class="chart-container" />
    <p class="chart-caption">
      Live preview — data cycles automatically every 2.5 s to show transitions
    </p>
  </div>
</template>

<style scoped>
.chart-demo {
  margin: 24px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
.chart-container {
  padding: 16px;
  display: flex;
  justify-content: center;
  background: var(--vp-c-bg-soft);
}
.chart-container :deep(svg) {
  font-family: var(--vp-font-family-base);
  font-size: 12px;
}
.chart-container :deep(.domain),
.chart-container :deep(.tick line) {
  stroke: var(--vp-c-text-3);
}
.chart-container :deep(.tick text) {
  fill: var(--vp-c-text-2);
}
.chart-caption {
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--vp-c-text-3);
  border-top: 1px solid var(--vp-c-divider);
  text-align: center;
}
</style>
