<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { pie, arc } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 400;
const HEIGHT = 400;
const RADIUS = Math.min(WIDTH, HEIGHT) / 2;
const INNER_RADIUS = RADIUS * 0.55;
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060', '#e8a838', '#7c6bbf'];

class DonutChart extends D3Blueprint {
  initialize() {
    this.colorScale = scaleOrdinal().range(COLORS);
    this.pieFn = pie().value((d) => d.value).sort(null);
    this.arcFn = arc().innerRadius(INNER_RADIUS).outerRadius(RADIUS - 10);
    this.hoverArc = arc().innerRadius(INNER_RADIUS).outerRadius(RADIUS - 4);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${WIDTH / 2},${HEIGHT / 2})`);

    const slicesGroup = this.chart.append('g').attr('class', 'slices');

    this.layer('slices', slicesGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('path').data(this.pieFn(data), (d) => d.data.label);
      },
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', (d) => this.colorScale(d.data.label))
            .attr('stroke', 'var(--vp-c-bg-soft)')
            .attr('stroke-width', 2)
            .each(function (d) { this._current = { startAngle: d.endAngle, endAngle: d.endAngle }; });
        },
        'enter:transition': (transition) => {
          const arcFn = this.arcFn;
          transition.duration(600).attrTween('d', function (d) {
            const start = this._current;
            const interpolate = (t) => ({
              startAngle: start.startAngle + (d.startAngle - start.startAngle) * t,
              endAngle: start.endAngle + (d.endAngle - start.endAngle) * t,
            });
            this._current = d;
            return (t) => arcFn(interpolate(t));
          });
        },
        'merge:transition': (transition) => {
          const arcFn = this.arcFn;
          transition
            .duration(600)
            .attr('fill', (d) => this.colorScale(d.data.label))
            .attrTween('d', function (d) {
              const start = this._current || d;
              const interpolate = (t) => ({
                startAngle: start.startAngle + (d.startAngle - start.startAngle) * t,
                endAngle: start.endAngle + (d.endAngle - start.endAngle) * t,
              });
              this._current = d;
              return (t) => arcFn(interpolate(t));
            });
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Center label
    this.centerLabel = this.chart
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '14px')
      .attr('fill', 'var(--vp-c-text-2)');

    this.use(tooltipPlugin(this.chart, (chart, tooltip, data) => {
        const total = data.reduce((sum, d) => sum + d.value, 0);

        chart.chart.selectAll('.slices path')
          .on('mouseenter', function (event, d) {
            select(this).transition().duration(100).attr('d', chart.hoverArc);
            const pct = ((d.data.value / total) * 100).toFixed(1);
            const [cx, cy] = chart.arcFn.centroid(d);
            tooltip.show(cx, cy, `${d.data.label}: ${d.data.value} (${pct}%)`);
          })
          .on('mouseleave', function () {
            select(this).transition().duration(100).attr('d', chart.arcFn);
            tooltip.hide();
          });
      }
    ));
  }

  preDraw(data) {
    this.colorScale.domain(data.map((d) => d.label));
    const total = data.reduce((sum, d) => sum + d.value, 0);
    this.centerLabel.text(`Total: ${total}`);
  }
}

const datasets = [
  [
    { label: 'React', value: 42 },
    { label: 'Vue', value: 28 },
    { label: 'Angular', value: 18 },
    { label: 'Svelte', value: 8 },
    { label: 'Other', value: 4 },
  ],
  [
    { label: 'React', value: 38 },
    { label: 'Vue', value: 32 },
    { label: 'Angular', value: 14 },
    { label: 'Svelte', value: 12 },
    { label: 'Other', value: 4 },
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

  chart = new DonutChart(svg);
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
      Live preview: data cycles every 3 s with animated arc transitions
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
