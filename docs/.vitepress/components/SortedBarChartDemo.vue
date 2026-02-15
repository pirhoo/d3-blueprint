<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max, ascending, descending } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { BarsChart } from './charts/BarsChart.js';
import { tooltipPlugin } from '../plugins/Tooltip.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };

class SortedBarChart extends D3Blueprint {
  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.attach('bars', BarsChart, this.chart.append('g').classed('bars', true));

    this.usePlugin(tooltipPlugin(this.chart, (chart, tooltip) => {
        chart.attached.bars.base.selectAll('rect')
          .on('mouseenter', function (event, d) {
            select(this).attr('opacity', 0.8);
            tooltip.show(chart.xScale(d.label) + chart.xScale.bandwidth(), chart.yScale(d.value), `${d.label}: ${d.value}`);
          })
          .on('mouseleave', function () {
            select(this).attr('opacity', 1);
            tooltip.hide();
          });
      }
    ));
  }

  transform(data) {
    if (this._sortMode === 'asc') {
      return [...data].sort((a, b) => ascending(a.value, b.value));
    }
    if (this._sortMode === 'desc') {
      return [...data].sort((a, b) => descending(a.value, b.value));
    }
    return data;
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.xScale = scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.1);

    this.yScale = scaleLinear()
      .domain([0, max(data, (d) => d.value) ?? 0])
      .range([innerHeight, 0]);

    this.attached.axes.config({ xScale: this.xScale, yScale: this.yScale, innerWidth, innerHeight, duration: 750 });
    this.attached.bars.config({ xScale: this.xScale, yScale: this.yScale, innerHeight, fill: 'var(--vp-c-brand-1)', duration: 750 });
  }
}

const baseData = [
  { label: 'A', value: 120 },
  { label: 'B', value: 45 },
  { label: 'C', value: 200 },
  { label: 'D', value: 80 },
  { label: 'E', value: 160 },
  { label: 'F', value: 30 },
];

const sortModes = ['original', 'asc', 'desc'];

const container = ref(null);
let chart = null;
let modeIndex = 0;
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

  chart = new SortedBarChart(svg);
  chart._sortMode = 'original';
  chart.draw(baseData);

  intervalId = setInterval(() => {
    modeIndex = (modeIndex + 1) % sortModes.length;
    chart._sortMode = sortModes[modeIndex];
    chart.draw(baseData);
  }, 2500);
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
      Live preview: <code>transform()</code> sorts data — same BarsChart animates to new order
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
