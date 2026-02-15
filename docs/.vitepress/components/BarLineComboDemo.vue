<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { line } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { BarsChart } from './charts/BarsChart.js';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 40, bottom: 30, left: 40 };

class BarLineCombo extends D3Blueprint {
  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.attach('bars', BarsChart, this.chart.append('g').classed('bars', true));

    this.lineFn = line();

    this.use(tooltipPlugin(this.chart, (chart, tooltip) => {
        chart.attached.bars.base.selectAll('rect')
          .on('mouseenter', function (event, d) {
            select(this).attr('opacity', 0.8);
            tooltip.show(chart.xScale(d.label) + chart.xScale.bandwidth(), chart.yScale(d.value), `Bar: ${d.value}`);
          })
          .on('mouseleave', function () {
            select(this).attr('opacity', 1);
            tooltip.hide();
          });
        chart.chart.selectAll('.line-dots circle')
          .on('mouseenter', function (event, d) {
            select(this).attr('r', 5);
            tooltip.show(chart.xScale(d.label) + chart.xScale.bandwidth() / 2, chart.lineScale(d.line), `Line: ${d.line}`);
          })
          .on('mouseleave', function () {
            select(this).attr('r', 3);
            tooltip.hide();
          });
      }
    ));

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
            .attr('stroke', 'var(--vp-c-warning-1)')
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
            .attr('cy', (d) => this.lineScale(d.line))
            .attr('r', 0)
            .attr('fill', 'var(--vp-c-warning-1)');
        },
        'enter:transition': (transition) => {
          transition.duration(400).attr('r', 3);
        },
        'merge:transition': (transition) => {
          transition
            .duration(750)
            .attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.lineScale(d.line));
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

    this.xScale = scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.15);

    const maxVal = max(data, (d) => Math.max(d.value, d.line)) ?? 0;

    this.yScale = scaleLinear()
      .domain([0, maxVal])
      .range([innerHeight, 0]);

    this.lineScale = this.yScale;

    this.lineFn
      .x((d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
      .y((d) => this.lineScale(d.line));

    this.attached.axes.config({ xScale: this.xScale, yScale: this.yScale, innerWidth, innerHeight, duration: 750 });
    this.attached.bars.config({ xScale: this.xScale, yScale: this.yScale, innerHeight, fill: 'var(--vp-c-brand-1)', duration: 750 });
  }
}

const datasets = [
  [
    { label: 'Jan', value: 60, line: 45 },
    { label: 'Feb', value: 80, line: 70 },
    { label: 'Mar', value: 120, line: 90 },
    { label: 'Apr', value: 90, line: 110 },
    { label: 'May', value: 150, line: 130 },
  ],
  [
    { label: 'Jan', value: 100, line: 80 },
    { label: 'Feb', value: 40, line: 55 },
    { label: 'Mar', value: 75, line: 100 },
    { label: 'Apr', value: 130, line: 85 },
    { label: 'May', value: 60, line: 120 },
    { label: 'Jun', value: 110, line: 95 },
  ],
  [
    { label: 'Feb', value: 90, line: 60 },
    { label: 'Mar', value: 55, line: 80 },
    { label: 'Apr', value: 140, line: 100 },
    { label: 'May', value: 70, line: 130 },
    { label: 'Jun', value: 180, line: 150 },
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

  chart = new BarLineCombo(svg);
  chart.draw(datasets[0]);

  intervalId = setInterval(() => {
    datasetIndex = (datasetIndex + 1) % datasets.length;
    chart?.draw(datasets[datasetIndex]);
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
      Live preview: BarsChart + inline line layer composed in one blueprint
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
