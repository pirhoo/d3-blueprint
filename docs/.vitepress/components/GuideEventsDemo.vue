<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

const WIDTH = 380;
const HEIGHT = 140;
const MARGIN = { top: 12, right: 16, bottom: 24, left: 32 };

class EventChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleBand().padding(0.3);
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
            .attr('rx', 2);
        },
        'enter:transition': (transition) => {
          transition
            .duration(500)
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => innerHeight - this.yScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(500)
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => innerHeight - this.yScale(d.value))
            .attr('fill', 'var(--vp-c-brand-1)');
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('height', 0).attr('y', innerHeight).remove();
        },
      },
    });
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
    { label: 'Q1', value: 45 },
    { label: 'Q2', value: 72 },
    { label: 'Q3', value: 58 },
    { label: 'Q4', value: 85 },
  ],
  [
    { label: 'Q1', value: 60 },
    { label: 'Q2', value: 50 },
    { label: 'Q3', value: 78 },
    { label: 'Q4', value: 65 },
  ],
];

const container = ref(null);
const events = ref([]);
let chart = null;
let datasetIndex = 0;
let intervalId;

function addEvent(name) {
  events.value = [...events.value, name];
  if (events.value.length > 12) events.value = events.value.slice(-12);
}

onMounted(() => {
  if (!container.value) return;

  const svg = select(container.value)
    .append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .style('max-width', '100%')
    .style('height', 'auto');

  chart = new EventChart(svg);
  chart.on('preDraw', () => addEvent('preDraw'));
  chart.on('postDraw', () => addEvent('postDraw'));
  chart.on('postTransition', () => addEvent('postTransition'));

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
    <div ref="container" class="chart-container" />
    <div class="event-log">
      <span class="event-log-label">Events:</span>
      <span
        v-for="(evt, i) in events"
        :key="i"
        class="event-tag"
        :class="'event-' + evt"
      >{{ evt }}</span>
    </div>
    <p class="chart-caption">
      Chart-level events fire on each <code>draw()</code> call
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
.event-log {
  padding: 8px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  min-height: 34px;
}
.event-log-label {
  color: var(--vp-c-text-3);
  margin-right: 4px;
}
.event-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
}
.event-preDraw {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}
.event-postDraw {
  background: rgba(80, 160, 96, 0.15);
  color: #50a060;
}
.event-postTransition {
  background: rgba(228, 88, 88, 0.15);
  color: #e45858;
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
