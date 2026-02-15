<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { LineChart } from './charts/LineChart.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };
const POINT_COUNT = 60;
const WINDOW = 7;

function randomDataset() {
  const points = [];
  let v = 50 + Math.random() * 50;
  for (let i = 0; i < POINT_COUNT; i++) {
    v = Math.max(5, Math.min(200, v + (Math.random() - 0.5) * 30));
    points.push({ x: i, value: Math.round(v) });
  }
  return points;
}

function movingAvg(data, window) {
  return data.map((d, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((s, p) => s + p.value, 0) / slice.length;
    return { x: d.x, value: Math.round(avg) };
  });
}

class MovingAverageChart extends D3Blueprint {
  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.attach('rawLine', LineChart, this.chart.append('g'));

    // avgLine is NOT attached — it needs different data (smoothed)
    this.avgLine = new LineChart(this.chart.append('g'));

    this._smoothed = [];
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this._smoothed = movingAvg(data, WINDOW);

    const xScale = scaleLinear().domain([0, POINT_COUNT - 1]).range([0, innerWidth]);
    const yScale = scaleLinear().domain([0, max(data, (d) => d.value) * 1.1]).range([innerHeight, 0]);

    this.attached.axes.config({ xScale, yScale, innerWidth, innerHeight, duration: 800, xTickCount: 6, yTickCount: 5 });
    this.attached.rawLine.config({
      xScale, yScale,
      stroke: 'var(--vp-c-brand-1)',
      strokeWidth: 1,
      strokeOpacity: 0.35,
      duration: 800,
    });
    this.avgLine.config({
      xScale, yScale,
      stroke: 'var(--vp-c-brand-1)',
      strokeWidth: 2.5,
      duration: 800,
    });
  }

  postDraw() {
    this.avgLine.draw(this._smoothed);
  }
}

const container = ref(null);
let chart = null;
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

  chart = new MovingAverageChart(svg);
  chart.draw(randomDataset());

  intervalId = setInterval(() => {
    chart?.draw(randomDataset());
  }, 3000);
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
      Live preview: raw data (light) + 7-period moving average (bold), regenerated every 3 s
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

    :deep(.tick line) {
      stroke: var(--vp-c-text-3);
      stroke-dasharray: 2, 2;
    }

    :deep(.tick text) {
      fill: var(--vp-c-text-2);
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
