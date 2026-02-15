<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { min, max } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 500;
const HEIGHT = 360;
const MARGIN = { top: 10, right: 20, bottom: 30, left: 100 };

class DivergingBarChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleBand().padding(0.2);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    const barsGroup = this.chart.append('g').attr('class', 'bars');

    this.layer('bars', barsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('rect').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('rect'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(Math.min(0, d.value)))
            .attr('y', (d) => this.yScale(d.label))
            .attr('width', 0)
            .attr('height', this.yScale.bandwidth())
            .attr('fill', (d) => d.value >= 0 ? '#50a060' : '#e45858')
            .attr('rx', 2);
        },
        'enter:transition': (transition) => {
          transition
            .duration(600)
            .attr('width', (d) => Math.abs(this.xScale(d.value) - this.xScale(0)));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x', (d) => this.xScale(Math.min(0, d.value)))
            .attr('y', (d) => this.yScale(d.label))
            .attr('width', (d) => Math.abs(this.xScale(d.value) - this.xScale(0)))
            .attr('height', this.yScale.bandwidth())
            .attr('fill', (d) => d.value >= 0 ? '#50a060' : '#e45858');
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('width', 0).remove();
        },
      },
    });

    // Zero line
    this.zeroLine = this.chart
      .append('line')
      .attr('class', 'zero-line')
      .attr('stroke', 'var(--vp-c-text-2)')
      .attr('stroke-width', 1);

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.usePlugin(tooltipPlugin(this.chart, (chart, tooltip) => {
        chart.chart.selectAll('.bars rect')
          .on('mouseenter', function (event, d) {
            select(this).attr('fill-opacity', 0.8);
            const sign = d.value >= 0 ? '+' : '';
            tooltip.show(
              chart.xScale(d.value),
              chart.yScale(d.label) + chart.yScale.bandwidth() / 2,
              `${d.label}: ${sign}${d.value}%`,
            );
          })
          .on('mouseleave', function () {
            select(this).attr('fill-opacity', 1);
            tooltip.hide();
          });
      }
    ));
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const lo = min(data, (d) => d.value);
    const hi = max(data, (d) => d.value);
    const extent = Math.max(Math.abs(lo), Math.abs(hi));

    this.yScale.domain(data.map((d) => d.label)).range([0, innerHeight]);
    this.xScale.domain([-extent * 1.1, extent * 1.1]).range([0, innerWidth]).nice();

    this.zeroLine
      .attr('x1', this.xScale(0))
      .attr('x2', this.xScale(0))
      .attr('y1', 0)
      .attr('y2', innerHeight);

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 600,
      gridAxis: 'x',
      xTickCount: 8,
    });
  }
}

const datasets = [
  [
    { label: 'Energy', value: 12 },
    { label: 'Tech', value: 24 },
    { label: 'Healthcare', value: 8 },
    { label: 'Finance', value: -5 },
    { label: 'Real Estate', value: -18 },
    { label: 'Consumer', value: 3 },
    { label: 'Utilities', value: -8 },
    { label: 'Materials', value: 15 },
  ],
  [
    { label: 'Energy', value: -6 },
    { label: 'Tech', value: 18 },
    { label: 'Healthcare', value: 14 },
    { label: 'Finance', value: 10 },
    { label: 'Real Estate', value: -12 },
    { label: 'Consumer', value: -4 },
    { label: 'Utilities', value: 5 },
    { label: 'Materials', value: -10 },
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

  chart = new DivergingBarChart(svg);
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
    <div ref="container" class="chart-demo__container" />
    <p class="chart-demo__caption">
      Live preview: data cycles every 3 s
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
