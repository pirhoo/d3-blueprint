<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

const WIDTH = 380;
const HEIGHT = 200;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 32 };

class ConfigurableChart extends D3Blueprint {
  initialize() {
    this.configDefine('barColor', { defaultValue: 'var(--vp-c-brand-1)' });

    this.xScale = scaleBand().padding(0.25);
    this.yScale = scaleLinear();

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const barsGroup = this.chart.append('g').attr('class', 'bars');

    this.layer('bars', barsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('rect').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('rect'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(d.label))
            .attr('width', this.xScale.bandwidth())
            .attr('y', innerHeight)
            .attr('height', 0)
            .attr('fill', this.config('barColor'))
            .attr('rx', 3);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('y', (d) => this.yScale(d.value))
            .attr('height', (d) => innerHeight - this.yScale(d.value))
            .attr('x', (d) => this.xScale(d.label))
            .attr('width', this.xScale.bandwidth())
            .attr('fill', this.config('barColor'));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('height', 0).attr('y', innerHeight).remove();
        },
      },
    });

    const labelsGroup = this.chart.append('g').attr('class', 'labels');

    this.layer('labels', labelsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('text').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('text'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2)
            .attr('y', innerHeight + 16)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('fill', 'var(--vp-c-text-2)')
            .text((d) => d.label);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('x', (d) => this.xScale(d.label) + this.xScale.bandwidth() / 2);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    this.xScale.domain(data.map((d) => d.label)).range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.value) * 1.1]).range([innerHeight, 0]);
  }
}

const data = [
  { label: 'Mon', value: 40 },
  { label: 'Tue', value: 65 },
  { label: 'Wed', value: 50 },
  { label: 'Thu', value: 80 },
  { label: 'Fri', value: 55 },
];

const barColors = ['var(--vp-c-brand-1)', '#e45858', '#50a060'];

const container = ref(null);
let chart = null;
let colorIndex = 0;
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

  chart = new ConfigurableChart(svg);
  chart.draw(data);

  intervalId = setInterval(() => {
    colorIndex = (colorIndex + 1) % barColors.length;
    chart?.config('barColor', barColors[colorIndex]);
    chart?.draw(data);
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
      Same data, cycling <code>config('barColor')</code> every 2.5 s
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
