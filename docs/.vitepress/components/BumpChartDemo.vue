<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleLinear, scalePoint, scaleOrdinal } from 'd3-scale';
import { curveBumpX } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { LineChart } from './charts/LineChart.js';
import { LegendChart } from './charts/LegendChart.js';

const WIDTH = 500;
const HEIGHT = 340;
const MARGIN = { top: 30, right: 20, bottom: 30, left: 45 };
const SERIES = ['Alpha', 'Beta', 'Gamma', 'Delta'];
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060', '#f59e0b'];
const PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];

function randomRankings() {
  return PERIODS.map((period) => {
    const shuffled = [...SERIES].sort(() => Math.random() - 0.5);
    const ranks = {};
    shuffled.forEach((s, i) => { ranks[s] = i + 1; });
    return { period, ranks };
  });
}

function toSeriesData(rankings) {
  return SERIES.map((name) => ({
    name,
    values: rankings.map((r) => ({ x: r.period, value: r.ranks[name] })),
  }));
}

class BumpChart extends D3Blueprint {
  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.colorScale = scaleOrdinal().domain(SERIES).range(COLORS);

    // Lines are NOT attached — we manage their draw() calls manually
    // so each gets its own per-series data
    this.lines = SERIES.map((name, i) => {
      const lc = new LineChart(this.chart.append('g'));
      lc.config({
        stroke: COLORS[i],
        strokeWidth: 2.5,
        showDots: true,
        dotRadius: 4,
        curve: curveBumpX,
        duration: 800,
      });
      return lc;
    });

    this.attach('legend', LegendChart,
      this.chart.append('g').attr('transform', `translate(0,-20)`)
    );
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const xScale = scalePoint().domain(PERIODS).range([0, innerWidth]).padding(0.5);
    const yScale = scaleLinear().domain([0.5, SERIES.length + 0.5]).range([0, innerHeight]);

    this.attached.axes.config({
      xScale, yScale, innerWidth, innerHeight, duration: 800,
      yTickCount: SERIES.length,
      yTickFormat: (d) => `#${d}`,
    });

    this.lines.forEach((lc) => {
      lc.config({ xScale, yScale, xValue: (d) => d.x, yValue: (d) => d.value });
    });

    this.attached.legend.config({
      items: SERIES.map((s, i) => ({ key: s, color: COLORS[i], label: s })),
      itemWidth: 80,
    });

    this._seriesData = toSeriesData(data);
  }

  postDraw() {
    this._seriesData.forEach((s, i) => {
      this.lines[i].draw(s.values);
    });
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

  chart = new BumpChart(svg);
  chart.draw(randomRankings());

  intervalId = setInterval(() => {
    chart?.draw(randomRankings());
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
      Live preview: bump chart with curveBumpX showing rank changes, regenerated every 3 s
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
