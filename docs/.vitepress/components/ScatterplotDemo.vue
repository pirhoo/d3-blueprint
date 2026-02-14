<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { max } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 500;
const HEIGHT = 400;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060'];
const GROUPS = ['Group A', 'Group B', 'Group C'];

function randomDataset() {
  const points = [];
  GROUPS.forEach((group, gi) => {
    const cx = 30 + gi * 30 + Math.random() * 20;
    const cy = 30 + Math.random() * 60;
    for (let i = 0; i < 25; i++) {
      points.push({
        x: cx + (Math.random() - 0.5) * 50,
        y: cy + (Math.random() - 0.5) * 40,
        group,
      });
    }
  });
  return points;
}

class Scatterplot extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().domain(GROUPS).range(COLORS);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.axes = new AxisChart(this.chart);
    this.attach('axes', this.axes);

    const dotsGroup = this.chart.append('g').attr('class', 'dots');

    this.layer('dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d, i) => i);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.y))
            .attr('r', 0)
            .attr('fill', (d) => this.colorScale(d.group))
            .attr('fill-opacity', 0.7);
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('r', 4);
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('r', 4)
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.y))
            .attr('fill', (d) => this.colorScale(d.group));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Legend
    const legendGroup = this.chart.append('g').attr('class', 'legend');

    this.layer('legend', legendGroup, {
      dataBind: (selection) => {
        return selection.selectAll('g.legend-item').data(GROUPS);
      },
      insert: (selection) => {
        const g = selection.append('g').attr('class', 'legend-item');
        g.append('circle');
        g.append('text');
        return g;
      },
      events: {
        merge: (selection) => {
          selection.attr('transform', (d, i) => `translate(${i * 90}, ${-10})`);
          selection.select('circle')
            .attr('r', 5)
            .attr('cy', 0)
            .attr('fill', (d) => this.colorScale(d));
          selection.select('text')
            .attr('x', 10)
            .attr('dy', '0.35em')
            .attr('font-size', '11px')
            .attr('fill', 'var(--vp-c-text-2)')
            .text((d) => d);
        },
      },
    });

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.usePlugin(tooltipPlugin({
      parent: this.chart,
      bind: (chart, tooltip) => {
        chart.chart.selectAll('.dots circle')
          .on('mouseenter', function (event, d) {
            select(this).attr('r', 6).attr('fill-opacity', 1);
            tooltip.show(
              chart.xScale(d.x),
              chart.yScale(d.y),
              [{ text: d.group, color: '#fff' }, { text: `(${d.x.toFixed(1)}, ${d.y.toFixed(1)})` }],
            );
          })
          .on('mouseleave', function () {
            select(this).attr('r', 4).attr('fill-opacity', 0.7);
            tooltip.hide();
          });
      },
    }));
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.xScale.domain([0, max(data, (d) => d.x) * 1.1]).range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.y) * 1.1]).range([innerHeight, 0]);

    this.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 800,
      xTickCount: 6,
      yTickCount: 6,
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

  chart = new Scatterplot(svg);
  chart.draw(randomDataset());

  intervalId = setInterval(() => {
    chart?.draw(randomDataset());
  }, 4000);
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
      Live preview: 75 random points in 3 groups, regenerated every 4 s
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
