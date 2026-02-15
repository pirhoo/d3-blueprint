<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scalePoint, scaleOrdinal } from 'd3-scale';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

const WIDTH = 380;
const HEIGHT = 180;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 20 };
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060', '#e8a838', '#7c6bbf', '#d4689a', '#4aa8c0'];

class DataJoinChart extends D3Blueprint {
  initialize() {
    this.xScale = scalePoint();
    this.colorScale = scaleOrdinal().range(COLORS);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const centerY = innerHeight / 2;

    const dotsGroup = this.chart.append('g').attr('class', 'dots');

    this.layer('dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d) => d.id);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => this.xScale(d.id))
            .attr('cy', centerY)
            .attr('r', 0)
            .attr('fill', (d) => this.colorScale(d.id));
        },
        'merge:transition': (transition) => {
          transition
            .duration(500)
            .attr('r', 18)
            .attr('cx', (d) => this.xScale(d.id))
            .attr('fill', (d) => this.colorScale(d.id));
        },
        'exit:transition': (transition) => {
          transition.duration(300).attr('r', 0).remove();
        },
      },
    });

    const lettersGroup = this.chart.append('g').attr('class', 'letters');

    this.layer('letters', lettersGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('text').data(data, (d) => d.id);
      },
      insert: (selection) => selection.append('text'),
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d) => this.xScale(d.id))
            .attr('y', centerY)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', '600')
            .attr('fill', '#fff')
            .attr('opacity', 0)
            .text((d) => d.id);
        },
        'merge:transition': (transition) => {
          transition
            .duration(500)
            .attr('opacity', 1)
            .attr('x', (d) => this.xScale(d.id));
        },
        'exit:transition': (transition) => {
          transition.duration(300).attr('opacity', 0).remove();
        },
      },
    });
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    this.xScale.domain(data.map((d) => d.id)).range([24, innerWidth - 24]);
  }
}

const datasets = [
  [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }],
  [{ id: 'C' }, { id: 'D' }, { id: 'E' }, { id: 'F' }, { id: 'G' }],
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

  chart = new DataJoinChart(svg);
  chart.draw(datasets[0]);

  intervalId = setInterval(() => {
    datasetIndex = (datasetIndex + 1) % datasets.length;
    chart?.draw(datasets[datasetIndex]);
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
      A, B exit · C, D reposition · E, F, G enter, then the reverse
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
