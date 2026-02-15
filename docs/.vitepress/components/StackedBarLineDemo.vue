<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';
import { max } from 'd3-array';
import { stack, line } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 30, right: 20, bottom: 30, left: 40 };
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060'];
const KEYS = ['mobile', 'desktop', 'tablet'];

class StackedBarLine extends D3Blueprint {
  initialize() {
    this.xScale = scaleBand().padding(0.2);
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().domain(KEYS).range(COLORS);
    this.stacked = [];
    this.lineFn = line();

    this.configDefine('keys', { defaultValue: [] });

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Layer 1: stacked bars
    const stackGroup = this.chart.append('g').attr('class', 'stacks');

    this.layer('stacks', stackGroup, {
      dataBind: (selection) => {
        return selection.selectAll('g.series').data(this.stacked, (d) => d.key);
      },
      insert: (selection) => {
        return selection.append('g').attr('class', 'series');
      },
      events: {
        merge: (selection) => {
          selection.attr('fill', (d) => this.colorScale(d.key));
          this._drawRects(selection);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer 2: trend line path
    const lineGroup = this.chart.append('g').attr('class', 'trend-line');

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
          transition.duration(600).attr('d', (d) => this.lineFn(d));
        },
      },
    });

    // Layer 3: trend line dots
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
            .attr('cy', (d) => this.yScale(d.trend))
            .attr('r', 0)
            .attr('fill', 'var(--vp-c-warning-1)');
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('cx', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('cy', (d) => this.yScale(d.trend));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Layer 4: legend
    const legendItems = [...KEYS, 'trend'];
    const legendGroup = this.chart.append('g').attr('class', 'legend');

    this.layer('legend', legendGroup, {
      dataBind: (selection) => {
        return selection.selectAll('g.legend-item').data(legendItems);
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
            .attr('fill', (d) =>
              d === 'trend' ? 'var(--vp-c-warning-1)' : this.colorScale(d));
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
        chart.chart.selectAll('.stacks rect')
          .on('mouseenter', function (event, d) {
            const key = select(this.parentNode).datum().key;
            const value = d[1] - d[0];
            select(this).attr('opacity', 0.8);
            tooltip.show(
              chart.xScale(d.data.label) + chart.xScale.bandwidth(),
              chart.yScale(d[1]),
              `${key}: ${value}`,
            );
          })
          .on('mouseleave', function () {
            select(this).attr('opacity', 1);
            tooltip.hide();
          });
        chart.chart.selectAll('.line-dots circle')
          .on('mouseenter', function (event, d) {
            select(this).attr('r', 5);
            tooltip.show(
              chart.xScale(d.label) + chart.xScale.bandwidth() / 2,
              chart.yScale(d.trend),
              `trend: ${d.trend}`,
            );
          })
          .on('mouseleave', function () {
            select(this).attr('r', 3);
            tooltip.hide();
          });
      }
    ));
  }

  _drawRects(seriesSelection) {
    const self = this;
    seriesSelection.each(function () {
      const group = select(this);
      const rects = group.selectAll('rect').data((d) => d);

      rects.enter()
        .append('rect')
        .attr('x', (d) => self.xScale(d.data.label))
        .attr('width', self.xScale.bandwidth())
        .attr('y', self.innerHeight)
        .attr('height', 0)
        .attr('rx', 1)
        .attr('y', (d) => self.yScale(d[1]))
        .attr('height', (d) => self.yScale(d[0]) - self.yScale(d[1]));

      rects.transition()
        .duration(600)
        .attr('x', (d) => self.xScale(d.data.label))
        .attr('width', self.xScale.bandwidth())
        .attr('y', (d) => self.yScale(d[1]))
        .attr('height', (d) => self.yScale(d[0]) - self.yScale(d[1]));

      rects.exit().transition().duration(200).attr('opacity', 0).remove();
    });
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    this.innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const keys = this.config('keys');

    this.colorScale.domain(keys);

    this.stacked = stack().keys(keys)(data);
    const stackMax = max(this.stacked[this.stacked.length - 1], (d) => d[1]);
    const trendMax = max(data, (d) => d.trend);
    const maxVal = max([stackMax, trendMax]);

    this.xScale.domain(data.map((d) => d.label)).range([0, innerWidth]);
    this.yScale.domain([0, maxVal]).range([this.innerHeight, 0]).nice();

    this.lineFn
      .x((d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
      .y((d) => this.yScale(d.trend));

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
    { label: 'Q1', mobile: 40, desktop: 80, tablet: 20, trend: 120 },
    { label: 'Q2', mobile: 60, desktop: 70, tablet: 30, trend: 140 },
    { label: 'Q3', mobile: 90, desktop: 60, tablet: 45, trend: 165 },
    { label: 'Q4', mobile: 70, desktop: 90, tablet: 35, trend: 175 },
  ],
  [
    { label: 'Q1', mobile: 80, desktop: 50, tablet: 40, trend: 150 },
    { label: 'Q2', mobile: 40, desktop: 100, tablet: 20, trend: 130 },
    { label: 'Q3', mobile: 60, desktop: 80, tablet: 55, trend: 170 },
    { label: 'Q4', mobile: 100, desktop: 40, tablet: 30, trend: 145 },
  ],
];

const keys = ['mobile', 'desktop', 'tablet'];

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

  chart = new StackedBarLine(svg);
  chart.config('keys', keys);
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
      Live preview: stacked bars with trend line animate together
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
