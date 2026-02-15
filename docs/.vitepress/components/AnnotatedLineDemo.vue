<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { curveCatmullRom } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { LineChart } from './charts/LineChart.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 60, bottom: 30, left: 45 };
const POINT_COUNT = 24;

function randomDataset() {
  const points = [];
  let v = 40 + Math.random() * 30;
  for (let i = 0; i < POINT_COUNT; i++) {
    v = Math.max(10, Math.min(200, v + (Math.random() - 0.5) * 35));
    points.push({ x: i, value: Math.round(v) });
  }
  return points;
}

class AnnotatedLineChart extends D3Blueprint {
  initialize() {
    this._firstDraw = true;

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.attach('line', LineChart, this.chart.append('g'));

    // Annotation layers (drawn on top)
    this.refLine = this.chart.append('line')
      .attr('class', 'ref-line')
      .attr('stroke', '#e45858')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '6,4')
      .attr('opacity', 0);

    this.refLabel = this.chart.append('text')
      .attr('class', 'ref-label')
      .attr('fill', '#e45858')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('opacity', 0);

    this.peakDot = this.chart.append('circle')
      .attr('fill', 'var(--vp-c-brand-1)')
      .attr('r', 0);

    this.peakLabel = this.chart.append('text')
      .attr('fill', 'var(--vp-c-text-1)')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('text-anchor', 'middle')
      .attr('opacity', 0);
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const firstDraw = this._firstDraw;
    this._firstDraw = false;

    const xScale = scaleLinear().domain([0, POINT_COUNT - 1]).range([0, innerWidth]);
    const yMax = max(data, (d) => d.value);
    const yScale = scaleLinear().domain([0, yMax * 1.2]).range([innerHeight, 0]);

    this.attached.axes.config({ xScale, yScale, innerWidth, innerHeight, duration: 800, xTickCount: 6, yTickCount: 5 });
    this.attached.line.config({
      xScale, yScale,
      curve: curveCatmullRom,
      stroke: 'var(--vp-c-brand-1)',
      strokeWidth: 2,
      duration: 800,
    });

    // Reference line at average
    const avg = Math.round(data.reduce((s, d) => s + d.value, 0) / data.length);
    const avgY = yScale(avg);

    // Peak annotation
    const peak = data.reduce((best, d) => d.value > best.value ? d : best, data[0]);
    const px = xScale(peak.x);
    const py = yScale(peak.value);

    if (firstDraw) {
      // Set positions immediately on first draw, then fade in
      this.refLine
        .attr('x1', 0).attr('x2', innerWidth)
        .attr('y1', avgY).attr('y2', avgY)
        .transition().duration(800)
        .attr('opacity', 1);

      this.refLabel
        .attr('x', innerWidth + 4).attr('y', avgY).attr('dy', '-4px')
        .text(`avg: ${avg}`)
        .transition().duration(800)
        .attr('opacity', 1);

      this.peakDot
        .attr('cx', px).attr('cy', py)
        .transition().duration(800)
        .attr('r', 5);

      this.peakLabel
        .attr('x', px).attr('y', py - 12)
        .text(`Peak: ${peak.value}`)
        .transition().duration(800)
        .attr('opacity', 1);
    } else {
      // Transition positions on subsequent draws
      this.refLine
        .transition().duration(800)
        .attr('x1', 0).attr('x2', innerWidth)
        .attr('y1', avgY).attr('y2', avgY)
        .attr('opacity', 1);

      this.refLabel
        .text(`avg: ${avg}`)
        .transition().duration(800)
        .attr('x', innerWidth + 4).attr('y', avgY)
        .attr('dy', '-4px');

      this.peakDot
        .transition().duration(800)
        .attr('cx', px).attr('cy', py)
        .attr('r', 5);

      this.peakLabel
        .text(`Peak: ${peak.value}`)
        .transition().duration(800)
        .attr('x', px).attr('y', py - 12);
    }
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

  chart = new AnnotatedLineChart(svg);
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
      Live preview: LineChart + inline annotations (reference line + peak callout), regenerated every 3 s
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
