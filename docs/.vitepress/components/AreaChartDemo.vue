<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select, pointer } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { line, area, curveCatmullRom } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };
const POINT_COUNT = 30;

function randomDataset() {
  const points = [];
  let value = 50 + Math.random() * 50;
  for (let i = 0; i < POINT_COUNT; i++) {
    value = Math.max(5, Math.min(200, value + (Math.random() - 0.5) * 30));
    points.push({ x: i, value: Math.round(value) });
  }
  return points;
}

class AreaChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.areaFn = area().curve(curveCatmullRom);
    this.lineFn = line().curve(curveCatmullRom);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.axes = new AxisChart(this.chart);
    this.attach('axes', this.axes);

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const areaGroup = this.chart.append('g').attr('class', 'area');

    this.layer('area', areaGroup, {
      dataBind: (selection, data) => selection.selectAll('path').data([data]),
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'var(--vp-c-brand-1)')
            .attr('fill-opacity', 0.15)
            .attr('d', (d) => this.areaFn(d));
        },
        'merge:transition': (transition) => {
          transition.duration(800).attr('d', (d) => this.areaFn(d));
        },
      },
    });

    const lineGroup = this.chart.append('g').attr('class', 'line');

    this.layer('line', lineGroup, {
      dataBind: (selection, data) => selection.selectAll('path').data([data]),
      insert: (selection) => selection.append('path'),
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

    this.crosshair = this.chart
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#999')
      .attr('stroke-dasharray', '4,3')
      .style('display', 'none');

    this.overlay = this.chart
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .style('pointer-events', 'all');

    this.usePlugin(tooltipPlugin({
      parent: this.chart,
      bind: (chart, tooltip, data) => {
        chart.overlay
          .on('mousemove', function (event) {
            const [mx] = pointer(event, this);
            const idx = Math.max(0, Math.min(Math.round(chart.xScale.invert(mx)), data.length - 1));
            const cx = chart.xScale(idx);

            chart.crosshair.attr('x1', cx).attr('x2', cx).style('display', null);
            tooltip.show(cx, chart.yScale(data[idx].value), `Value: ${data[idx].value}`);
          })
          .on('mouseleave', () => {
            chart.crosshair.style('display', 'none');
            tooltip.hide();
          });
      },
    }));
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.xScale.domain([0, data.length - 1]).range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.value) * 1.1]).range([innerHeight, 0]);

    this.areaFn
      .x((d) => this.xScale(d.x))
      .y0(innerHeight)
      .y1((d) => this.yScale(d.value));

    this.lineFn
      .x((d) => this.xScale(d.x))
      .y((d) => this.yScale(d.value));

    this.axes.config({
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

  chart = new AreaChart(svg);
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
      Live preview: 30 random data points, regenerated every 3 s
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
