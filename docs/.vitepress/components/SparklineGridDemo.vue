<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { LineChart } from './charts/LineChart.js';

const CELL_W = 150;
const CELL_H = 60;
const COLS = 3;
const ROWS = 2;
const PAD = 4;
const WIDTH = COLS * CELL_W + (COLS - 1) * 12;
const HEIGHT = ROWS * CELL_H + (ROWS - 1) * 12;
const POINT_COUNT = 20;
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060', '#c084fc', '#f59e0b', '#06b6d4'];

function randomSeries() {
  return Array.from({ length: 6 }, () => {
    const pts = [];
    let v = 30 + Math.random() * 40;
    for (let i = 0; i < POINT_COUNT; i++) {
      v = Math.max(5, Math.min(95, v + (Math.random() - 0.5) * 20));
      pts.push({ x: i, value: Math.round(v) });
    }
    return pts;
  });
}

class SparklineGrid extends D3Blueprint {
  initialize() {
    this.sparklines = [];
    for (let idx = 0; idx < 6; idx++) {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const gx = col * (CELL_W + 12);
      const gy = row * (CELL_H + 12);
      const g = this.base.append('g').attr('transform', `translate(${gx},${gy})`);

      g.append('rect')
        .attr('width', CELL_W)
        .attr('height', CELL_H)
        .attr('rx', 4)
        .attr('fill', 'var(--vp-c-bg-soft)')
        .attr('stroke', 'var(--vp-c-divider)');

      const inner = g.append('g').attr('transform', `translate(${PAD},${PAD})`);
      this.attach(`spark-${idx}`, LineChart, inner);
      const sparkline = this.attached[`spark-${idx}`];
      sparkline.config({ stroke: COLORS[idx], strokeWidth: 1.5, duration: 600 });
      this.sparklines.push(sparkline);
    }
  }

  preDraw(allSeries) {
    const innerW = CELL_W - PAD * 2;
    const innerH = CELL_H - PAD * 2;

    allSeries.forEach((data, idx) => {
      const xScale = scaleLinear().domain([0, POINT_COUNT - 1]).range([0, innerW]);
      const [yMin, yMax] = extent(data, (d) => d.value);
      const yScale = scaleLinear().domain([yMin * 0.9, yMax * 1.1]).range([innerH, 0]);

      this.sparklines[idx].config({ xScale, yScale, duration: 600 });
    });
  }

  transform(allSeries) {
    return allSeries[0];
  }
}

const container = ref(null);
let chart = null;
let allSeries = null;
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

  chart = new SparklineGrid(svg);
  allSeries = randomSeries();

  // Draw each sparkline individually
  allSeries.forEach((data, idx) => {
    const xScale = scaleLinear().domain([0, POINT_COUNT - 1]).range([0, CELL_W - PAD * 2]);
    const [yMin, yMax] = extent(data, (d) => d.value);
    const yScale = scaleLinear().domain([yMin * 0.9, yMax * 1.1]).range([CELL_H - PAD * 2, 0]);
    chart.sparklines[idx].config({ xScale, yScale, duration: 600 });
    chart.sparklines[idx].draw(data);
  });

  intervalId = setInterval(() => {
    allSeries = randomSeries();
    allSeries.forEach((data, idx) => {
      const xScale = scaleLinear().domain([0, POINT_COUNT - 1]).range([0, CELL_W - PAD * 2]);
      const [yMin, yMax] = extent(data, (d) => d.value);
      const yScale = scaleLinear().domain([yMin * 0.9, yMax * 1.1]).range([CELL_H - PAD * 2, 0]);
      chart.sparklines[idx].config({ xScale, yScale, duration: 600 });
      chart.sparklines[idx].draw(data);
    });
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
      Live preview: 6 sparklines using LineChart without AxisChart, regenerated every 3 s
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
