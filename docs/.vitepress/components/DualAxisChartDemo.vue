<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { line } from 'd3-shape';
import { axisRight } from 'd3-axis';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { BarsChart } from './charts/BarsChart.js';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 50, bottom: 30, left: 50 };

class DualAxisChart extends D3Blueprint {
  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.rightAxisGroup = this.chart.append('g').attr('class', 'right-axis');

    this.attach('bars', BarsChart, this.chart.append('g').classed('bars', true));

    this.lineFn = line();

    this.usePlugin(tooltipPlugin({
      parent: this.chart,
      bind: (chart, tooltip) => {
        chart.attached.bars.base.selectAll('rect')
          .on('mouseenter', function (event, d) {
            select(this).attr('opacity', 0.8);
            tooltip.show(chart.xScale(d.label) + chart.xScale.bandwidth(), chart.yLeft(d.value), `Revenue: ${d.value}`);
          })
          .on('mouseleave', function () {
            select(this).attr('opacity', 1);
            tooltip.hide();
          });
        chart.chart.selectAll('.line-dots circle')
          .on('mouseenter', function (event, d) {
            select(this).attr('r', 5);
            tooltip.show(chart.xScale(d.label) + chart.xScale.bandwidth() / 2, chart.yRight(d.growth), `Growth: ${d.growth}%`);
          })
          .on('mouseleave', function () {
            select(this).attr('r', 3);
            tooltip.hide();
          });
      },
    }));

    // Line path layer
    const lineGroup = this.chart.append('g').attr('class', 'combo-line');

    this.layer('line', lineGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('path').data([data]);
      },
      insert: (selection) => {
        return selection.append('path');
      },
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'none')
            .attr('stroke', '#e45858')
            .attr('stroke-width', 2.5)
            .attr('d', (d) => this.lineFn(d));
        },
        'merge:transition': (transition) => {
          transition.duration(750).attr('d', (d) => this.lineFn(d));
        },
      },
    });

    // Line dots layer
    const dotsGroup = this.chart.append('g').attr('class', 'line-dots');

    this.layer('line-dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.label);
      },
      insert: (selection) => {
        return selection.append('circle');
      },
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.yRight(d.growth))
            .attr('r', 0)
            .attr('fill', '#e45858');
        },
        'enter:transition': (transition) => {
          transition.duration(400).attr('r', 3);
        },
        'merge:transition': (transition) => {
          transition
            .duration(750)
            .attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.yRight(d.growth));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const duration = 750;

    this.xScale = scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    this.yLeft = scaleLinear()
      .domain([0, (max(data, (d) => d.value) ?? 0) * 1.1])
      .range([innerHeight, 0]);

    this.yRight = scaleLinear()
      .domain([0, (max(data, (d) => d.growth) ?? 0) * 1.2])
      .range([innerHeight, 0]);

    this.lineFn
      .x((d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
      .y((d) => this.yRight(d.growth));

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yLeft,
      innerWidth,
      innerHeight,
      duration,
      yTickCount: 5,
    });

    const rightAxis = axisRight(this.yRight).ticks(5).tickSize(0).tickPadding(10);
    this.rightAxisGroup
      .attr('transform', `translate(${innerWidth},0)`)
      .transition().duration(duration).call(rightAxis);
    this.rightAxisGroup.select('.domain').remove();

    this.attached.bars.config({
      xScale: this.xScale,
      yScale: this.yLeft,
      innerHeight,
      fill: 'var(--vp-c-brand-1)',
      duration,
    });
  }
}

const datasets = [
  [
    { label: 'Q1', value: 120, growth: 12 },
    { label: 'Q2', value: 180, growth: 18 },
    { label: 'Q3', value: 150, growth: 8 },
    { label: 'Q4', value: 220, growth: 25 },
  ],
  [
    { label: 'Q1', value: 160, growth: 15 },
    { label: 'Q2', value: 140, growth: 10 },
    { label: 'Q3', value: 200, growth: 22 },
    { label: 'Q4', value: 170, growth: 14 },
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

  chart = new DualAxisChart(svg);
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
      Live preview: bars (left axis) and line (right axis) animate together
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
