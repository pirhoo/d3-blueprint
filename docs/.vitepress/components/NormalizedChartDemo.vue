<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { max, min } from 'd3-array';
import { curveCatmullRom } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { LineChart } from './charts/LineChart.js';
import { LegendChart } from './charts/LegendChart.js';

const WIDTH = 500;
const HEIGHT = 340;
const MARGIN = { top: 30, right: 20, bottom: 30, left: 50 };
const POINT_COUNT = 20;
const SERIES_NAMES = ['Fund A', 'Fund B', 'Fund C'];
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060'];

function randomSeries() {
  return SERIES_NAMES.map((name) => {
    const values = [];
    let v = 80 + Math.random() * 40;
    for (let i = 0; i < POINT_COUNT; i++) {
      v = Math.max(20, Math.min(300, v + (Math.random() - 0.5) * 30));
      values.push({ x: i, raw: Math.round(v) });
    }
    return { name, values };
  });
}

function normalize(series) {
  return series.map((s) => {
    const base = s.values[0].raw;
    return {
      name: s.name,
      values: s.values.map((d) => ({
        x: d.x,
        value: Math.round((d.raw / base) * 100),
      })),
    };
  });
}

class NormalizedChart extends D3Blueprint {
  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Lines are NOT attached — we manage their draw() calls manually
    // so each gets its own per-series data
    this.lines = SERIES_NAMES.map((name, i) => {
      const lc = new LineChart(this.chart.append('g'));
      lc.config({
        stroke: COLORS[i],
        strokeWidth: 2,
        curve: curveCatmullRom,
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

    this._normalized = normalize(data);
    const allValues = this._normalized.flatMap((s) => s.values);

    const xScale = scaleLinear().domain([0, POINT_COUNT - 1]).range([0, innerWidth]);
    const yScale = scaleLinear()
      .domain([min(allValues, (d) => d.value) * 0.9, max(allValues, (d) => d.value) * 1.1])
      .range([innerHeight, 0]);

    this.attached.axes.config({
      xScale, yScale, innerWidth, innerHeight, duration: 800,
      xTickCount: 6, yTickCount: 5,
      yTickFormat: (d) => d + '%',
    });

    this.lines.forEach((lc) => {
      lc.config({ xScale, yScale });
    });

    this.attached.legend.config({
      items: SERIES_NAMES.map((s, i) => ({ key: s, color: COLORS[i], label: s })),
      itemWidth: 80,
    });
  }

  postDraw() {
    this._normalized.forEach((s, i) => {
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

  chart = new NormalizedChart(svg);
  chart.draw(randomSeries());

  intervalId = setInterval(() => {
    chart?.draw(randomSeries());
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
      Live preview: 3 series normalized to 100% at first value, regenerated every 3.5 s
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
