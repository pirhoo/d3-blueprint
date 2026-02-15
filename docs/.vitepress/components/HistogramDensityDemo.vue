<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { max, bin, mean } from 'd3-array';
import { line, curveBasis } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { Tooltip } from './charts/Tooltip.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };

function normalRandom() {
  // Box-Muller transform
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function randomDataset() {
  const m = 50 + Math.random() * 20;
  const std = 10 + Math.random() * 10;
  return Array.from({ length: 500 }, () => m + normalRandom() * std);
}

function gaussianKernel(bandwidth) {
  return (v) =>
    Math.exp(-0.5 * (v / bandwidth) ** 2) / (bandwidth * Math.sqrt(2 * Math.PI));
}

function kde(kernel, thresholds, data) {
  return thresholds.map((t) => ({ x: t, y: mean(data, (d) => kernel(t - d)) }));
}

class HistogramDensity extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.densityScale = scaleLinear();
    this.lineFn = line().curve(curveBasis);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    // Layer 1: histogram bars
    const barsGroup = this.chart.append('g').attr('class', 'bars');

    this.layer('bars', barsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('rect').data(data.bins, (d) => d.x0);
      },
      insert: (selection) => selection.append('rect'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(d.x0) + 1)
            .attr('width', (d) => Math.max(0, this.xScale(d.x1) - this.xScale(d.x0) - 2))
            .attr('y', innerHeight)
            .attr('height', 0)
            .attr('fill', 'var(--vp-c-brand-1)')
            .attr('fill-opacity', 0.5)
            .attr('rx', 1);
        },
        'enter:transition': (transition) => {
          transition
            .duration(600)
            .attr('y', (d) => this.yScale(d.length))
            .attr('height', (d) => innerHeight - this.yScale(d.length));
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x', (d) => this.xScale(d.x0) + 1)
            .attr('width', (d) => Math.max(0, this.xScale(d.x1) - this.xScale(d.x0) - 2))
            .attr('y', (d) => this.yScale(d.length))
            .attr('height', (d) => innerHeight - this.yScale(d.length));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer 2: density curve
    const curveGroup = this.chart.append('g').attr('class', 'curve');

    this.layer('curve', curveGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('path').data([data.curve]);
      },
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'none')
            .attr('stroke', '#e45858')
            .attr('stroke-width', 2.5)
            .attr('d', (d) => this.lineFn(d));
        },
        'merge:transition': (transition) => {
          transition.duration(600).attr('d', (d) => this.lineFn(d));
        },
      },
    });

    this.usePlugin(new Tooltip(this.chart, (chart, tooltip) => {
        chart.chart.selectAll('.bars rect')
          .on('mouseenter', function (event, d) {
            select(this).attr('fill-opacity', 0.8);
            tooltip.show(
              chart.xScale((d.x0 + d.x1) / 2),
              chart.yScale(d.length),
              `${d.x0}\u2013${d.x1}: ${d.length} values`,
            );
          })
          .on('mouseleave', function () {
            select(this).attr('fill-opacity', 0.5);
            tooltip.hide();
          });
      }
    ));
  }

  transform(data) {
    this.xScale.domain([0, 100]);
    const bins = bin().domain(this.xScale.domain()).thresholds(20)(data);

    const thresholds = Array.from({ length: 100 }, (_, i) => i);
    const curve = kde(gaussianKernel(3), thresholds, data);

    return { bins, curve };
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.xScale.range([0, innerWidth]);
    this.yScale.domain([0, max(data.bins, (d) => d.length)]).range([innerHeight, 0]).nice();

    this.densityScale = scaleLinear()
      .domain([0, max(data.curve, (d) => d.y)])
      .range([innerHeight, 0]);

    this.lineFn
      .x((d) => this.xScale(d.x))
      .y((d) => this.densityScale(d.y));

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 600,
      xTickCount: 10,
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

  chart = new HistogramDensity(svg);
  chart.draw(randomDataset());

  intervalId = setInterval(() => {
    chart?.draw(randomDataset());
  }, 3500);
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
      Live preview: histogram bins and density curve from the same data, regenerated every 3.5 s
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
