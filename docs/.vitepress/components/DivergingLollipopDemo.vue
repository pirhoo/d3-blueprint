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

class DivergingLollipop extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleBand().padding(0.4);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Layer 1: stems (horizontal lines from zero to value)
    const stemsGroup = this.chart.append('g').attr('class', 'stems');

    this.layer('stems', stemsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('line').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('line'),
      events: {
        enter: (selection) => {
          selection
            .attr('x1', this.xScale(0))
            .attr('x2', this.xScale(0))
            .attr('y1', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('y2', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('stroke', 'var(--vp-c-text-3)')
            .attr('stroke-width', 1.5);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x1', this.xScale(0))
            .attr('x2', (d) => this.xScale(d.value))
            .attr('y1', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('y2', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('x2', this.xScale(0)).remove();
        },
      },
    });

    // Layer 2: dots at the tip
    const dotsGroup = this.chart.append('g').attr('class', 'dots');

    this.layer('dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', this.xScale(0))
            .attr('cy', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('r', 5)
            .attr('fill', (d) => d.value >= 0 ? '#50a060' : '#e45858');
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('cx', (d) => this.xScale(d.value))
            .attr('cy', (d) => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('fill', (d) => d.value >= 0 ? '#50a060' : '#e45858');
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Zero line (persistent element, not a layer)
    this.zeroLine = this.chart
      .append('line')
      .attr('class', 'zero-line')
      .attr('stroke', 'var(--vp-c-text-2)')
      .attr('stroke-width', 1);

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.use(tooltipPlugin(this.chart, (chart, tooltip) => {
        chart.chart.selectAll('.dots circle')
          .on('mouseenter', function (event, d) {
            select(this).attr('r', 7);
            const sign = d.value >= 0 ? '+' : '';
            tooltip.show(
              chart.xScale(d.value),
              chart.yScale(d.label) + chart.yScale.bandwidth() / 2,
              `${d.label}: ${sign}${d.value}%`,
            );
          })
          .on('mouseleave', function () {
            select(this).attr('r', 5);
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

  chart = new DivergingLollipop(svg);
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
