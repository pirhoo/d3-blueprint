<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { line, curveCatmullRom } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from '../plugins/Tooltip.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };
const POINT_COUNT = 24;

function randomDataset() {
  const points = [];
  let value = 50 + Math.random() * 50;
  for (let i = 0; i < POINT_COUNT; i++) {
    value = Math.max(5, Math.min(200, value + (Math.random() - 0.5) * 40));
    points.push({ x: i, value: Math.round(value) });
  }
  return points;
}

class LineChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.lineFn = line().curve(curveCatmullRom);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.usePlugin(tooltipPlugin(this.chart, (chart, tooltip) => {
        chart.chart.selectAll('.dots circle')
          .on('mouseenter', function (event, d) {
            select(this).attr('r', 5);
            tooltip.show(chart.xScale(d.x), chart.yScale(d.value), `Value: ${d.value}`);
          })
          .on('mouseleave', function () {
            select(this).attr('r', 3);
            tooltip.hide();
          });
      }
    ));

    // Layer 1: the line path
    const lineGroup = this.chart.append('g').attr('class', 'line');

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
            .attr('stroke', 'var(--vp-c-brand-1)')
            .attr('stroke-width', 2)
            .attr('d', (d) => this.lineFn(d));
        },
        'merge:transition': (transition) => {
          transition.duration(800).attr('d', (d) => this.lineFn(d));
        },
      },
    });

    // Layer 2: dots at each data point
    const dotsGroup = this.chart.append('g').attr('class', 'dots');

    this.layer('dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.x);
      },
      insert: (selection) => {
        return selection.append('circle');
      },
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.value))
            .attr('r', 0)
            .attr('fill', 'var(--vp-c-brand-1)');
        },
        'enter:transition': (transition) => {
          transition.duration(400).attr('r', 3);
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.value));
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

    this.xScale.domain([0, data.length - 1]).range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.value) * 1.1]).range([innerHeight, 0]);

    this.lineFn
      .x((d) => this.xScale(d.x))
      .y((d) => this.yScale(d.value));

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 800,
      xTickCount: 6,
      yTickCount: 5,
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

  chart = new LineChart(svg);
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
      Live preview: 24 random data points, regenerated every 3 s
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
