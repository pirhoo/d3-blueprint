<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { max, min, sum } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from '../plugins/Tooltip.js';

const WIDTH = 500;
const HEIGHT = 400;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };

function randomDataset() {
  const slope = 0.5 + Math.random() * 1.5;
  const intercept = 10 + Math.random() * 30;
  return Array.from({ length: 50 }, (_, i) => {
    const x = Math.random() * 100;
    const y = slope * x + intercept + (Math.random() - 0.5) * 40;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });
}

class ScatterTrendLine extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Layer 1: scatter dots
    const dotsGroup = this.chart.append('g').attr('class', 'dots');

    this.layer('dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d, i) => i);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.y))
            .attr('r', 0)
            .attr('fill', 'var(--vp-c-brand-1)')
            .attr('fill-opacity', 0.6);
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('r', 4);
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('r', 4)
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.y));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Layer 2: trend line
    const trendGroup = this.chart.append('g').attr('class', 'trend');

    this.layer('trend', trendGroup, {
      dataBind: (selection) => {
        return selection.selectAll('line').data([this._trendData]);
      },
      insert: (selection) => selection.append('line'),
      events: {
        enter: (selection) => {
          selection
            .attr('x1', (d) => this.xScale(d[0].x))
            .attr('y1', (d) => this.yScale(d[0].y))
            .attr('x2', (d) => this.xScale(d[1].x))
            .attr('y2', (d) => this.yScale(d[1].y))
            .attr('stroke', '#e45858')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '6,3');
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('x1', (d) => this.xScale(d[0].x))
            .attr('y1', (d) => this.yScale(d[0].y))
            .attr('x2', (d) => this.xScale(d[1].x))
            .attr('y2', (d) => this.yScale(d[1].y));
        },
      },
    });

    this.usePlugin(tooltipPlugin(this.chart, (chart, tooltip) => {
        chart.chart.selectAll('.dots circle')
          .on('mouseenter', function (event, d) {
            select(this).attr('r', 6).attr('fill-opacity', 1);
            tooltip.show(
              chart.xScale(d.x),
              chart.yScale(d.y),
              `(${d.x}, ${d.y})`,
            );
          })
          .on('mouseleave', function () {
            select(this).attr('r', 4).attr('fill-opacity', 0.6);
            tooltip.hide();
          });
      }
    ));
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const xMin = min(data, (d) => d.x);
    const xMax = max(data, (d) => d.x);

    this.xScale.domain([0, xMax * 1.1]).range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.y) * 1.1]).range([innerHeight, 0]);

    // Compute linear regression (least squares)
    const n = data.length;
    const sumX = sum(data, (d) => d.x);
    const sumY = sum(data, (d) => d.y);
    const sumXY = sum(data, (d) => d.x * d.y);
    const sumX2 = sum(data, (d) => d.x * d.x);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    this._trendData = [
      { x: xMin, y: slope * xMin + intercept },
      { x: xMax, y: slope * xMax + intercept },
    ];

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 800,
      xTickCount: 6,
      yTickCount: 6,
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

  chart = new ScatterTrendLine(svg);
  chart.draw(randomDataset());

  intervalId = setInterval(() => {
    chart?.draw(randomDataset());
  }, 4000);
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
      Live preview: scatter points with computed regression line, regenerated every 4 s
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
