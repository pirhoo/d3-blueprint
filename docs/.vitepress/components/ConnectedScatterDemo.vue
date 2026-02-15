<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { curveCatmullRom } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { LineChart } from './charts/LineChart.js';

const WIDTH = 500;
const HEIGHT = 360;
const MARGIN = { top: 20, right: 20, bottom: 35, left: 50 };
const POINT_COUNT = 12;

function randomDataset() {
  const points = [];
  let x = 20 + Math.random() * 30;
  let y = 20 + Math.random() * 30;
  for (let i = 0; i < POINT_COUNT; i++) {
    x = Math.max(5, Math.min(95, x + (Math.random() - 0.5) * 25));
    y = Math.max(5, Math.min(95, y + (Math.random() - 0.5) * 25));
    points.push({ year: 2000 + i, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }
  return points;
}

class ConnectedScatterplot extends D3Blueprint {
  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.attach('line', LineChart, this.chart.append('g'));

    // Year labels
    this.labelsGroup = this.chart.append('g').attr('class', 'year-labels');
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const [xMin, xMax] = extent(data, (d) => d.x);
    const [yMin, yMax] = extent(data, (d) => d.y);

    const xScale = scaleLinear().domain([xMin * 0.8, xMax * 1.2]).range([0, innerWidth]);
    const yScale = scaleLinear().domain([yMin * 0.8, yMax * 1.2]).range([innerHeight, 0]);

    this.attached.axes.config({ xScale, yScale, innerWidth, innerHeight, duration: 800, xTickCount: 5, yTickCount: 5 });
    this.attached.line.config({
      xScale, yScale,
      xValue: (d) => d.x,
      yValue: (d) => d.y,
      curve: curveCatmullRom,
      stroke: 'var(--vp-c-brand-1)',
      strokeWidth: 1.5,
      showDots: true,
      dotRadius: 4,
      duration: 800,
    });

    // Year labels
    const labels = this.labelsGroup.selectAll('text').data(data, (d) => d.year);

    labels.enter()
      .append('text')
      .attr('font-size', '10px')
      .attr('fill', 'var(--vp-c-text-3)')
      .attr('text-anchor', 'middle')
      .attr('dy', '-8px')
      .attr('x', (d) => xScale(d.x))
      .attr('y', (d) => yScale(d.y))
      .text((d) => d.year)
      .merge(labels)
      .transition()
      .duration(800)
      .attr('x', (d) => xScale(d.x))
      .attr('y', (d) => yScale(d.y));

    labels.exit().transition().duration(200).attr('opacity', 0).remove();
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

  chart = new ConnectedScatterplot(svg);
  chart.draw(randomDataset());

  intervalId = setInterval(() => {
    chart?.draw(randomDataset());
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
      Live preview: connected scatterplot tracing a path through 2D space over time, regenerated every 3.5 s
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
