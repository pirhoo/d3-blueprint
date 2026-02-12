<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

const WIDTH = 380;
const HEIGHT = 260;
const MARGIN = { top: 16, right: 16, bottom: 60, left: 32 };

class SummaryPanel extends D3Blueprint {
  initialize() {
    this.label = this.base.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('fill', 'var(--vp-c-text-2)');
  }

  preDraw(data) {
    const total = data.reduce((s, d) => s + d.value, 0);
    const avg = (total / data.length).toFixed(0);
    this.label.text(`${data.length} items \u00b7 Total: ${total} \u00b7 Avg: ${avg}`);
  }
}

class MainChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleBand().padding(0.25);
    this.yScale = scaleLinear();

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
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

    // Attach a SummaryPanel sub-chart below the bars
    const summaryGroup = this.chart.append('g')
      .attr('transform', `translate(${innerWidth / 2},${innerHeight + 40})`);
    this.attach('summary', new SummaryPanel(summaryGroup));
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    this.xScale.domain(data.map((d) => d.label)).range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.value) * 1.1]).range([innerHeight, 0]);
  }
}

const datasets = [
  [
    { label: 'Jan', value: 30 },
    { label: 'Feb', value: 55 },
    { label: 'Mar', value: 42 },
    { label: 'Apr', value: 70 },
    { label: 'May', value: 48 },
  ],
  [
    { label: 'Jan', value: 45 },
    { label: 'Feb', value: 38 },
    { label: 'Mar', value: 65 },
    { label: 'Apr', value: 52 },
    { label: 'May', value: 80 },
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

  chart = new MainChart(svg);
  chart.draw(datasets[0]);

  intervalId = setInterval(() => {
    datasetIndex = (datasetIndex + 1) % datasets.length;
    chart?.draw(datasets[datasetIndex]);
  }, 3000);
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
      <code>MainChart</code> draws bars · attached <code>SummaryPanel</code> updates automatically
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
.chart-caption {
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--vp-c-text-3);
  border-top: 1px solid var(--vp-c-divider);
  text-align: center;
}
</style>
