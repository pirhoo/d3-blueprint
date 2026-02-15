<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { area, curveCatmullRom } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { Tooltip } from '../plugins/Tooltip.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };

class LollipopAreaRange extends D3Blueprint {
  initialize() {
    this.xScale = scaleBand().padding(0.2);
    this.yScale = scaleLinear();
    this.areaFn = area().curve(curveCatmullRom);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Layer 1: confidence range area
    const rangeGroup = this.chart.append('g').attr('class', 'range');

    this.layer('range', rangeGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('path').data([data]);
      },
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'var(--vp-c-brand-1)')
            .attr('fill-opacity', 0.12)
            .attr('d', (d) => this.areaFn(d));
        },
        'merge:transition': (transition) => {
          transition.duration(600).attr('d', (d) => this.areaFn(d));
        },
      },
    });

    // Layer 2: stems (vertical lines from baseline to value)
    const stemsGroup = this.chart.append('g').attr('class', 'stems');

    this.layer('stems', stemsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('line').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('line'),
      events: {
        enter: (selection) => {
          const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
          selection
            .attr('x1', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('x2', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('y1', this.yScale(0))
            .attr('y2', this.yScale(0))
            .attr('stroke', 'var(--vp-c-text-3)')
            .attr('stroke-width', 1.5);
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('y2', (d) => this.yScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x1', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('x2', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('y1', this.yScale(0))
            .attr('y2', (d) => this.yScale(d.value));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('y2', this.yScale(0)).remove();
        },
      },
    });

    // Layer 3: dots at the tip
    const dotsGroup = this.chart.append('g').attr('class', 'dots');

    this.layer('dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', this.yScale(0))
            .attr('r', 6)
            .attr('fill', 'var(--vp-c-brand-1)');
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('cy', (d) => this.yScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.yScale(d.value))
            .attr('r', 6);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.usePlugin(new Tooltip(this.chart, (chart, tooltip) => {
        chart.chart.selectAll('.dots circle')
          .on('mouseenter', function (event, d) {
            select(this).attr('r', 8);
            tooltip.show(
              chart.xScale(d.label) + chart.xScale.bandwidth() / 2,
              chart.yScale(d.value),
              `${d.label}: ${d.value} (${d.low}–${d.high})`,
            );
          })
          .on('mouseleave', function () {
            select(this).attr('r', 6);
            tooltip.hide();
          });
      }
    ));
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const maxHigh = max(data, (d) => d.high);

    this.xScale.domain(data.map((d) => d.label)).range([0, innerWidth]);
    this.yScale.domain([0, maxHigh * 1.1]).range([innerHeight, 0]);

    this.areaFn
      .x((d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
      .y0((d) => this.yScale(d.low))
      .y1((d) => this.yScale(d.high));

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 600,
      xTickCount: 6,
      yTickCount: 5,
    });
  }
}

const datasets = [
  [
    { label: 'Jan', value: 65, low: 50, high: 80 },
    { label: 'Feb', value: 80, low: 65, high: 95 },
    { label: 'Mar', value: 55, low: 40, high: 70 },
    { label: 'Apr', value: 90, low: 75, high: 105 },
    { label: 'May', value: 70, low: 55, high: 85 },
    { label: 'Jun', value: 100, low: 85, high: 115 },
  ],
  [
    { label: 'Jan', value: 75, low: 60, high: 90 },
    { label: 'Feb', value: 60, low: 45, high: 75 },
    { label: 'Mar', value: 85, low: 70, high: 100 },
    { label: 'Apr', value: 50, low: 35, high: 65 },
    { label: 'May', value: 95, low: 80, high: 110 },
    { label: 'Jun', value: 65, low: 50, high: 80 },
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

  chart = new LollipopAreaRange(svg);
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
      Live preview: lollipop markers with confidence band, data cycles every 3 s
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
