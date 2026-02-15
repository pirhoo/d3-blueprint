<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { min, max } from 'd3-array';
import { area, line } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';

const WIDTH = 560;
const HEIGHT = 380;
const MARGIN = { top: 44, right: 20, bottom: 50, left: 45 };
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060'];
const MODES = ['lines', 'base0', 'areas', 'bars'];
const MODE_LABELS = {
  lines: 'Multiline',
  base0: 'Variation (%)',
  areas: 'Stacked Areas (%)',
  bars: 'Stacked Bars (%)',
};
const POINT_COUNT = 20;
const SERIES = [
  { name: 'Mobile', values: [25, 28, 30, 35, 33, 40, 42, 48, 52, 55, 60, 58, 65, 70, 75, 82, 88, 95, 105, 120] },
  { name: 'Desktop', values: [100, 98, 96, 92, 94, 88, 85, 82, 80, 78, 75, 72, 70, 68, 65, 62, 58, 55, 52, 50] },
  { name: 'Tablet', values: [15, 18, 20, 22, 19, 24, 26, 25, 28, 30, 32, 30, 34, 36, 33, 38, 40, 42, 40, 45] },
];

class TransformingChart extends D3Blueprint {
  initialize() {
    this.configDefine('mode', { defaultValue: 'lines' });

    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().range(COLORS);
    this.areaFn = area();
    this.lineFn = line();
    this.seriesData = [];
    this.seriesNames = [];

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Zero baseline, prominent when y-axis crosses zero
    this.zeroLine = this.chart
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('stroke', 'var(--vp-c-text-1)')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0);

    // Mode label
    this.modeLabel = this.chart
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -18)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', 'var(--vp-c-text-1)');

    // Layer: area fills
    const areasGroup = this.chart.append('g').attr('class', 'areas');

    this.layer('areas', areasGroup, {
      dataBind: (selection) =>
        selection.selectAll('path').data(this.seriesData, (d) => d.name),
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', (d) => this.colorScale(d.name))
            .attr('fill-opacity', 0)
            .attr('stroke', 'none')
            .attr('d', (d) => this.areaFn(d.points));
        },
        'merge:transition': (transition) => {
          const mode = this.config('mode');
          transition.duration(800)
            .attr('fill-opacity', mode === 'areas' ? 0.65 : 0)
            .attr('d', (d) => this.areaFn(d.points));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('fill-opacity', 0).remove();
        },
      },
    });

    // Layer: bar groups (one <g> per series, each containing rects)
    const barsGroup = this.chart.append('g').attr('class', 'bar-groups');

    this.layer('bar-groups', barsGroup, {
      dataBind: (selection) =>
        selection.selectAll('g.series').data(this.seriesData, (d) => d.name),
      insert: (selection) => selection.append('g').attr('class', 'series'),
      events: {
        merge: (selection) => {
          selection.attr('fill', (d) => this.colorScale(d.name));
          this._drawBars(selection);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer: line strokes
    const linesGroup = this.chart.append('g').attr('class', 'lines');

    this.layer('lines', linesGroup, {
      dataBind: (selection) =>
        selection.selectAll('path').data(this.seriesData, (d) => d.name),
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'none')
            .attr('stroke', (d) => this.colorScale(d.name))
            .attr('stroke-width', 2.5)
            .attr('d', (d) => this.lineFn(d.points));
        },
        'merge:transition': (transition) => {
          const mode = this.config('mode');
          transition.duration(800)
            .attr('stroke-width', mode === 'lines' || mode === 'base0' ? 2.5 : mode === 'areas' ? 1.5 : 0)
            .attr('opacity', mode === 'bars' ? 0 : 1)
            .attr('d', (d) => this.lineFn(d.points));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer: legend
    const legendGroup = this.chart.append('g').attr('class', 'legend');

    this.layer('legend', legendGroup, {
      dataBind: (selection) =>
        selection.selectAll('g.legend-item').data(this.seriesNames),
      insert: (selection) => {
        const g = selection.append('g').attr('class', 'legend-item');
        g.append('rect');
        g.append('text');
        return g;
      },
      events: {
        merge: (selection) => {
          const totalWidth = this.seriesNames.length * 90;
          const startX = (innerWidth - totalWidth) / 2;
          selection.attr('transform', (d, i) =>
            `translate(${startX + i * 90}, ${innerHeight + 28})`);
          selection.select('rect')
            .attr('width', 12).attr('height', 12).attr('rx', 2)
            .attr('fill', (d) => this.colorScale(d));
          selection.select('text')
            .attr('x', 16).attr('y', 6).attr('dy', '0.35em')
            .attr('font-size', '11px')
            .attr('fill', 'var(--vp-c-text-2)')
            .text((d) => d);
        },
      },
    });
  }

  _drawBars(seriesSelection) {
    const self = this;
    const mode = this.config('mode');
    const barWidth = this.barWidth;

    seriesSelection.each(function () {
      const group = select(this);
      const rects = group.selectAll('rect').data((d) => d.points);

      rects.enter()
        .append('rect')
        .attr('x', (d) => self.xScale(d.x) - barWidth / 2)
        .attr('y', (d) => self.yScale(d.y1))
        .attr('width', barWidth)
        .attr('height', (d) => Math.max(0, self.yScale(d.y0) - self.yScale(d.y1)))
        .attr('rx', 2)
        .attr('opacity', 0)
      .merge(rects)
        .transition()
        .duration(800)
        .attr('x', (d) => self.xScale(d.x) - barWidth / 2)
        .attr('y', (d) => self.yScale(d.y1))
        .attr('width', barWidth)
        .attr('height', (d) => Math.max(0, self.yScale(d.y0) - self.yScale(d.y1)))
        .attr('opacity', mode === 'bars' ? 0.9 : 0);

      rects.exit().transition().duration(200).attr('opacity', 0).remove();
    });
  }

  preDraw(data) {
    const mode = this.config('mode');
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.colorScale.domain(data.map((d) => d.name));
    this.seriesNames = data.map((d) => d.name);
    this.xScale.domain([0, POINT_COUNT - 1]).range([0, innerWidth]);
    this.barWidth = (innerWidth / POINT_COUNT) * 0.8;

    if (mode === 'lines') {
      const maxVal = max(data.flatMap((s) => s.values)) * 1.1;
      this.yScale.domain([0, maxVal]).range([innerHeight, 0]).nice();

      this.seriesData = data.map((s) => ({
        name: s.name,
        points: s.values.map((v, i) => ({ x: i, y0: 0, y1: v })),
      }));
    } else if (mode === 'base0') {
      // Percentage variation from first value (can go negative)
      const variations = data.flatMap((s) =>
        s.values.map((v) => ((v - s.values[0]) / s.values[0]) * 100),
      );
      this.yScale
        .domain([min(variations), max(variations)])
        .range([innerHeight, 0])
        .nice();

      this.seriesData = data.map((s) => ({
        name: s.name,
        points: s.values.map((v, i) => ({
          x: i,
          y0: 0,
          y1: ((v - s.values[0]) / s.values[0]) * 100,
        })),
      }));
    } else {
      // Stacked percentages (areas or bars)
      this.yScale.domain([0, 100]).range([innerHeight, 0]);

      const normalized = data[0].values.map((_, i) => {
        const total = data.reduce((sum, s) => sum + s.values[i], 0);
        return data.map((s) => (s.values[i] / total) * 100);
      });

      this.seriesData = data.map((s, si) => ({
        name: s.name,
        points: normalized.map((col, i) => {
          const y0 = col.slice(0, si).reduce((a, b) => a + b, 0);
          const y1 = y0 + col[si];
          return { x: i, y0, y1 };
        }),
      }));
    }

    this.areaFn
      .x((d) => this.xScale(d.x))
      .y0((d) => this.yScale(d.y0))
      .y1((d) => this.yScale(d.y1));

    this.lineFn
      .x((d) => this.xScale(d.x))
      .y((d) => this.yScale(d.y1));

    this.modeLabel.text(MODE_LABELS[mode]);

    // Show zero baseline when y domain crosses zero
    const [yMin, yMax] = this.yScale.domain();
    const showZero = yMin < 0 && yMax > 0;
    this.zeroLine
      .transition()
      .duration(800)
      .attr('y1', this.yScale(0))
      .attr('y2', this.yScale(0))
      .attr('opacity', showZero ? 1 : 0);

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 800,
      xTickCount: 5,
      yTickCount: 5,
    });
  }
}

const container = ref(null);
let chart = null;
let modeIndex = 0;
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

  chart = new TransformingChart(svg);
  chart.draw(SERIES);

  intervalId = setInterval(() => {
    modeIndex = (modeIndex + 1) % MODES.length;
    chart.config('mode', MODES[modeIndex]);
    chart?.draw(SERIES);
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
      Live preview: cycles through 4 visualization modes every 3 s
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
