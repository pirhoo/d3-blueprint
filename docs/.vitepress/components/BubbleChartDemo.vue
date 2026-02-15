<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { pack, hierarchy } from 'd3-hierarchy';
import { format } from 'd3-format';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 500;
const HEIGHT = 500;
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060', '#e8a838', '#7c6bbf'];
const GROUPS = ['Engineering', 'Design', 'Marketing', 'Sales', 'Support'];
const fmt = format(',d');

function randomDataset() {
  const items = [];
  for (const group of GROUPS) {
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      items.push({
        name: `${group} ${i + 1}`,
        group,
        value: 10 + Math.round(Math.random() * 90),
      });
    }
  }
  return items;
}

class BubbleChart extends D3Blueprint {
  initialize() {
    this.colorScale = scaleOrdinal().domain(GROUPS).range(COLORS);
    this.packLayout = pack().size([WIDTH - 2, HEIGHT - 2]).padding(3);

    this.chart = this.base.append('g').attr('transform', 'translate(1,1)');

    const bubblesGroup = this.chart.append('g').attr('class', 'bubbles');

    this.layer('bubbles', bubblesGroup, {
      dataBind: (selection, data) => {
        const root = this.packLayout(
          hierarchy({ children: data }).sum((d) => d.value),
        );
        return selection.selectAll('circle').data(root.leaves(), (d) => d.data.name);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y)
            .attr('r', 0)
            .attr('fill', (d) => this.colorScale(d.data.group))
            .attr('fill-opacity', 0.7);
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y)
            .attr('r', (d) => d.r)
            .attr('fill', (d) => this.colorScale(d.data.group));
        },
        'exit:transition': (transition) => {
          transition.duration(300).attr('r', 0).remove();
        },
      },
    });

    this.use(tooltipPlugin(this.chart, (chart, tooltip, data) => {
      const root = chart.packLayout(
        hierarchy({ children: data }).sum((d) => d.value),
      );
      chart.chart.selectAll('.bubbles circle')
        .on('mouseenter', function (event, d) {
          select(this).attr('fill-opacity', 1);
          tooltip.show(d.x, d.y, [
            { text: d.data.name },
            { text: `${d.data.group}: ${fmt(d.data.value)}`, color: chart.colorScale(d.data.group) },
          ]);
        })
        .on('mouseleave', function () {
          select(this).attr('fill-opacity', 0.7);
          tooltip.hide();
        });
    }));
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

  chart = new BubbleChart(svg);
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
      Live preview: random team data, regenerated every 3.5 s
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
