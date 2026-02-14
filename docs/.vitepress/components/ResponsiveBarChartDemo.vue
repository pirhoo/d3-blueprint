<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { BarsChart } from './charts/BarsChart.js';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';
import { responsivePlugin } from '../plugins/responsivePlugin.js';

const HEIGHT = 300;

class ResponsiveBarChart extends D3Blueprint {
  initialize() {
    this.configDefine('width', { defaultValue: 600 });
    this.configDefine('height', { defaultValue: HEIGHT });
    this.configDefine('margin', {
      defaultValue: { top: 20, right: 20, bottom: 30, left: 40 },
    });

    const margin = this.config('margin');
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    this.axes = new AxisChart(this.chart);
    this.attach('axes', this.axes);

    this.bars = new BarsChart(this.chart.append('g').classed('bars', true));
    this.attach('bars', this.bars);

    this.usePlugin(tooltipPlugin({
      parent: this.chart,
      bind: (chart, tooltip) => {
        chart.bars.base.selectAll('rect')
          .on('mouseenter', function (event, d) {
            select(this).attr('opacity', 0.8);
            tooltip.show(chart.xScale(d.label) + chart.xScale.bandwidth(), chart.yScale(d.value), `${d.label}: ${d.value}`);
          })
          .on('mouseleave', function () {
            select(this).attr('opacity', 1);
            tooltip.hide();
          });
      },
    }));
  }

  preDraw(data) {
    const width = this.config('width');
    const height = this.config('height');
    const margin = this.config('margin');

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    this.base.attr('width', width).attr('viewBox', `0 0 ${width} ${height}`);

    this.xScale = scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.1);

    this.yScale = scaleLinear()
      .domain([0, max(data, (d) => d.value) ?? 0])
      .range([innerHeight, 0]);

    this.axes.config({ xScale: this.xScale, yScale: this.yScale, innerWidth, innerHeight, duration: 400 });
    this.bars.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerHeight,
      fill: 'var(--vp-c-brand-1)',
      duration: 400,
      rx: 2,
    });
  }
}

const data = [
  { label: 'A', value: 30 },
  { label: 'B', value: 86 },
  { label: 'C', value: 168 },
  { label: 'D', value: 47 },
  { label: 'E', value: 120 },
  { label: 'F', value: 65 },
];

const container = ref(null);
let chart = null;

onMounted(() => {
  if (!container.value) return;

  const width = container.value.clientWidth - 32;

  const svg = select(container.value)
    .append('svg')
    .attr('width', width)
    .attr('height', HEIGHT)
    .attr('viewBox', `0 0 ${width} ${HEIGHT}`)
    .style('display', 'block');

  chart = new ResponsiveBarChart(svg);
  chart.config('width', width);

  chart.usePlugin(responsivePlugin({
    container: container.value,
    getSize: (el) => ({ width: el.clientWidth - 32 }),
  }));

  chart.draw(data);
});

onUnmounted(() => {
  chart?.destroy();
});
</script>

<template>
  <div class="chart-demo">
    <div ref="container" class="chart-demo__container" />
    <p class="chart-demo__caption">
      Resize your browser window. The chart redraws to fill its container
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
