<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { area, line, curveCatmullRom } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { BarsChart } from './charts/BarsChart.js';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };

class AreaBarOverlay extends D3Blueprint {
  transform(data) {
    return data.map((d) => ({ ...d, value: d.highlight }));
  }

  initialize() {
    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    this.areaFn = area().curve(curveCatmullRom);
    this.lineFn = line().curve(curveCatmullRom);

    // Area layer (background)
    const areaGroup = this.chart.append('g').attr('class', 'area');

    this.layer('area', areaGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('path').data([data]);
      },
      insert: (selection) => {
        return selection.append('path');
      },
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'var(--vp-c-brand-1)')
            .attr('fill-opacity', 0.1)
            .attr('d', (d) => this.areaFn(d));
        },
        'merge:transition': (transition) => {
          transition.duration(750).attr('d', (d) => this.areaFn(d));
        },
      },
    });

    // Area top-edge line layer
    const areaLineGroup = this.chart.append('g').attr('class', 'area-line');

    this.layer('area-line', areaLineGroup, {
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
            .attr('stroke-width', 1.5)
            .attr('d', (d) => this.lineFn(d));
        },
        'merge:transition': (transition) => {
          transition.duration(750).attr('d', (d) => this.lineFn(d));
        },
      },
    });

    // Bars layer (foreground highlights)
    this.attach('bars', BarsChart, this.chart.append('g').classed('bars', true));

    this.use(tooltipPlugin(this.chart, (chart, tooltip) => {
        chart.attached.bars.base.selectAll('rect')
          .on('mouseenter', function (event, d) {
            select(this).attr('opacity', 0.8);
            tooltip.show(
              chart.xScale(d.label) + chart.xScale.bandwidth(),
              chart.yScale(d.value),
              `${d.label} — Highlight: ${d.highlight}, Total: ${d.total}`,
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
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const duration = 750;

    this.xScale = scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.15);

    this.yScale = scaleLinear()
      .domain([0, (max(data, (d) => d.total) ?? 0) * 1.1])
      .range([innerHeight, 0]);

    this.areaFn
      .x((d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
      .y0(innerHeight)
      .y1((d) => this.yScale(d.total));

    this.lineFn
      .x((d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
      .y((d) => this.yScale(d.total));

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration,
      yTickCount: 5,
    });

    this.attached.bars.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerHeight,
      fill: '#e45858',
      duration,
      rx: 2,
    });
  }
}

const datasets = [
  [
    { label: 'Jan', total: 120, highlight: 45 },
    { label: 'Feb', total: 150, highlight: 70 },
    { label: 'Mar', total: 100, highlight: 30 },
    { label: 'Apr', total: 180, highlight: 90 },
    { label: 'May', total: 140, highlight: 55 },
    { label: 'Jun', total: 200, highlight: 110 },
  ],
  [
    { label: 'Jan', total: 90, highlight: 50 },
    { label: 'Feb', total: 170, highlight: 40 },
    { label: 'Mar', total: 130, highlight: 80 },
    { label: 'Apr', total: 110, highlight: 60 },
    { label: 'May', total: 190, highlight: 100 },
    { label: 'Jun', total: 160, highlight: 75 },
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

  chart = new AreaBarOverlay(svg);
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
      Live preview: area trend with bar highlights, data cycles every 3 s
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
