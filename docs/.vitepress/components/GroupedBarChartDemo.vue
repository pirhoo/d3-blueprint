<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';
import { max } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 30, right: 20, bottom: 30, left: 40 };
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060'];
const KEYS = ['mobile', 'desktop', 'tablet'];

class GroupedBarChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleBand().padding(0.2);
    this.x1Scale = scaleBand().padding(0.05);
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().domain(KEYS).range(COLORS);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Layer 1: grouped bars
    const barsGroup = this.chart.append('g').attr('class', 'bars');

    this.layer('bars', barsGroup, {
      dataBind: (selection, data) => {
        const flat = [];
        data.forEach((d) => {
          KEYS.forEach((key) => {
            flat.push({ label: d.label, key, value: d[key] });
          });
        });
        return selection.selectAll('rect').data(flat, (d) => `${d.label}-${d.key}`);
      },
      insert: (selection) => {
        return selection.append('rect');
      },
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(d.label) + this.x1Scale(d.key))
            .attr('width', this.x1Scale.bandwidth())
            .attr('y', this.innerHeight)
            .attr('height', 0)
            .attr('rx', 1)
            .attr('fill', (d) => this.colorScale(d.key));
        },
        'enter:transition': (transition) => {
          transition
            .duration(600)
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => this.innerHeight - this.yScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x', (d) => this.xScale(d.label) + this.x1Scale(d.key))
            .attr('width', this.x1Scale.bandwidth())
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => this.innerHeight - this.yScale(d.value))
            .attr('fill', (d) => this.colorScale(d.key));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer 2: legend
    const legendGroup = this.chart.append('g').attr('class', 'legend');

    this.layer('legend', legendGroup, {
      dataBind: (selection) => {
        return selection.selectAll('g.legend-item').data(KEYS);
      },
      insert: (selection) => {
        const g = selection.append('g').attr('class', 'legend-item');
        g.append('rect');
        g.append('text');
        return g;
      },
      events: {
        merge: (selection) => {
          selection.attr('transform', (d, i) =>
            `translate(${i * 90}, ${-10})`);
          selection.select('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('rx', 2)
            .attr('fill', (d) => this.colorScale(d));
          selection.select('text')
            .attr('x', 16)
            .attr('y', 6)
            .attr('dy', '0.35em')
            .attr('font-size', '11px')
            .attr('fill', 'var(--vp-c-text-2)')
            .text((d) => d);
        },
      },
    });

    this.use(tooltipPlugin(this.chart, (chart, tooltip) => {
        chart.chart.selectAll('.bars rect')
          .on('mouseenter', function (event, d) {
            select(this).attr('opacity', 0.8);
            tooltip.show(
              chart.xScale(d.label) + chart.x1Scale(d.key) + chart.x1Scale.bandwidth(),
              chart.yScale(d.value),
              `${d.key}: ${d.value}`,
            );
          })
          .on('mouseleave', function () {
            select(this).attr('opacity', 1);
            tooltip.hide();
          });
      }
    ));
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    this.innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.xScale.domain(data.map((d) => d.label)).range([0, innerWidth]);
    this.x1Scale.domain(KEYS).range([0, this.xScale.bandwidth()]);

    const maxVal = max(data, (d) => max(KEYS, (key) => d[key])) ?? 0;
    this.yScale.domain([0, maxVal]).range([this.innerHeight, 0]).nice();

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight: this.innerHeight,
      duration: 600,
    });
  }
}

const datasets = [
  [
    { label: 'Q1', mobile: 40, desktop: 80, tablet: 20 },
    { label: 'Q2', mobile: 60, desktop: 70, tablet: 30 },
    { label: 'Q3', mobile: 90, desktop: 60, tablet: 45 },
    { label: 'Q4', mobile: 70, desktop: 90, tablet: 35 },
  ],
  [
    { label: 'Q1', mobile: 80, desktop: 50, tablet: 40 },
    { label: 'Q2', mobile: 40, desktop: 100, tablet: 20 },
    { label: 'Q3', mobile: 60, desktop: 80, tablet: 55 },
    { label: 'Q4', mobile: 100, desktop: 40, tablet: 30 },
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

  chart = new GroupedBarChart(svg);
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
      Live preview: grouped bars animate when data changes
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
