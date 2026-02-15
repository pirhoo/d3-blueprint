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
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060', '#e8a838'];
const fmt = format(',d');

const LANGUAGES = [
  { name: 'JavaScript', group: 'Web' },
  { name: 'TypeScript', group: 'Web' },
  { name: 'Python', group: 'Data' },
  { name: 'R', group: 'Data' },
  { name: 'Java', group: 'Enterprise' },
  { name: 'Kotlin', group: 'Enterprise' },
  { name: 'C#', group: 'Enterprise' },
  { name: 'Go', group: 'Systems' },
  { name: 'Rust', group: 'Systems' },
  { name: 'C++', group: 'Systems' },
  { name: 'Swift', group: 'Mobile' },
  { name: 'Ruby', group: 'Web' },
  { name: 'PHP', group: 'Web' },
  { name: 'Scala', group: 'Data' },
];

const GROUPS = [...new Set(LANGUAGES.map((l) => l.group))];

function randomDataset() {
  return LANGUAGES.map((l) => ({
    ...l,
    value: 5 + Math.round(Math.random() * 95),
  }));
}

class LabeledBubbleChart extends D3Blueprint {
  initialize() {
    this.colorScale = scaleOrdinal().domain(GROUPS).range(COLORS);
    this.packLayout = pack().size([WIDTH - 2, HEIGHT - 2]).padding(3);

    this.chart = this.base.append('g').attr('transform', 'translate(1,1)');

    const nodesGroup = this.chart.append('g').attr('class', 'nodes');

    // Layer for circle + text groups
    this.layer('nodes', nodesGroup, {
      dataBind: (selection, data) => {
        const root = this.packLayout(
          hierarchy({ children: data }).sum((d) => d.value),
        );
        return selection.selectAll('g').data(root.leaves(), (d) => d.data.name);
      },
      insert: (selection) => {
        const g = selection.append('g');
        g.append('circle');
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '-0.2em')
          .attr('fill', 'var(--vp-c-text-1)')
          .attr('font-size', '10px')
          .attr('pointer-events', 'none');
        g.append('text')
          .attr('class', 'value-label')
          .attr('text-anchor', 'middle')
          .attr('dy', '1em')
          .attr('fill', 'var(--vp-c-text-1)')
          .attr('opacity', '0.5')
          .attr('font-size', '9px')
          .attr('pointer-events', 'none');
        return g;
      },
      events: {
        merge: (selection) => {
          selection
            .select('text:not(.value-label)')
            .text((d) => (d.r > 20 ? d.data.name : ''));
          selection
            .select('.value-label')
            .text((d) => (d.r > 25 ? fmt(d.data.value) : ''));
        },
        'merge:transition': (transition) => {
          transition.duration(800).attr('transform', (d) => `translate(${d.x},${d.y})`);
          transition.select('circle')
            .attr('r', (d) => d.r)
            .attr('fill', (d) => this.colorScale(d.data.group))
            .attr('fill-opacity', 0.7);
        },
        'exit:transition': (transition) => {
          transition.duration(300).attr('opacity', 0).remove();
        },
      },
    });

    this.use(tooltipPlugin(this.chart, (chart, tooltip) => {
      chart.chart.selectAll('.nodes g')
        .on('mouseenter', function (event, d) {
          select(this).select('circle').attr('fill-opacity', 1);
          tooltip.show(d.x, d.y, [
            { text: d.data.name },
            { text: `${d.data.group}: ${fmt(d.data.value)}`, color: chart.colorScale(d.data.group) },
          ]);
        })
        .on('mouseleave', function () {
          select(this).select('circle').attr('fill-opacity', 0.7);
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

  chart = new LabeledBubbleChart(svg);
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
      Live preview: programming language popularity, regenerated every 3.5 s
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
