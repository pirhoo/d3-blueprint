<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { format } from 'd3-format';
import 'd3-transition';
import { D3Compose } from '../../../src/index';
import type { D3Selection } from '../../../src/index';

interface BarDatum {
  label: string;
  value: number;
}

interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN: Margin = { top: 20, right: 20, bottom: 30, left: 45 };
const TICK_COUNT = 5;
const fmt = format(',d');

class MultiLayerBarChart extends D3Compose<BarDatum[]> {
  declare xScale: ReturnType<typeof scaleBand<string>>;
  declare yScale: ReturnType<typeof scaleLinear>;
  declare innerWidth: number;
  declare innerHeight: number;

  protected initialize(): void {
    this.xScale = scaleBand<string>().padding(0.1);
    this.yScale = scaleLinear();
    this.innerWidth = 0;
    this.innerHeight = 0;

    this.configDefine('width', { defaultValue: WIDTH });
    this.configDefine('height', { defaultValue: HEIGHT });
    this.configDefine('margin', { defaultValue: MARGIN });

    const margin = this.config('margin') as Margin;
    const chart = this.base
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // ---------- Layer 1: y-axis gridlines + ticks ----------
    const yAxisGroup = chart.append('g').attr('class', 'y-axis');

    this.layer('y-axis', yAxisGroup as unknown as D3Selection, {
      dataBind: (selection, _data) => {
        return selection
          .selectAll<SVGGElement, number>('.tick')
          .data(this.yScale.ticks(TICK_COUNT)) as unknown as D3Selection;
      },
      insert: (selection) => {
        const tick = selection.append('g').attr('class', 'tick');
        tick.append('line').attr('class', 'gridline');
        tick.append('text');
        return tick as unknown as D3Selection;
      },
      events: {
        enter: (selection) => {
          selection
            .attr('opacity', 0)
            .attr('transform', (d: any) => `translate(0,${this.yScale(d)})`);
          selection.select('line')
            .attr('x2', this.innerWidth)
            .attr('stroke', 'currentColor')
            .attr('stroke-opacity', 0.1);
          selection.select('text')
            .attr('x', -8)
            .attr('dy', '0.32em')
            .attr('text-anchor', 'end')
            .text((d: any) => fmt(d));
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('opacity', 1);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('opacity', 1)
            .attr('transform', (d: any) => `translate(0,${this.yScale(d)})`);
          transition.selection().select('line').attr('x2', this.innerWidth);
          transition.selection().select('text').text((d: any) => fmt(d));
        },
        'exit:transition': (transition) => {
          transition.duration(300).attr('opacity', 0).remove();
        },
      },
    });

    // ---------- Layer 2: x-axis ticks ----------
    const xAxisGroup = chart.append('g').attr('class', 'x-axis');

    this.layer('x-axis', xAxisGroup as unknown as D3Selection, {
      dataBind: (selection, data) => {
        return selection
          .selectAll<SVGGElement, string>('.tick')
          .data(data.map((d) => d.label)) as unknown as D3Selection;
      },
      insert: (selection) => {
        const tick = selection.append('g').attr('class', 'tick');
        tick.append('line');
        tick.append('text');
        return tick as unknown as D3Selection;
      },
      events: {
        enter: (selection) => {
          selection
            .attr('opacity', 0)
            .attr('transform', (d: any) =>
              `translate(${this.xScale(d)! + this.xScale.bandwidth() / 2},${this.innerHeight})`);
          selection.select('line')
            .attr('y2', 6)
            .attr('stroke', 'currentColor');
          selection.select('text')
            .attr('y', 9)
            .attr('dy', '0.71em')
            .attr('text-anchor', 'middle')
            .text((d: any) => d);
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('opacity', 1);
        },
        'merge:transition': (transition) => {
          transition
            .duration(600)
            .attr('opacity', 1)
            .attr('transform', (d: any) =>
              `translate(${this.xScale(d)! + this.xScale.bandwidth() / 2},${this.innerHeight})`);
          transition.selection().select('text').text((d: any) => d);
        },
        'exit:transition': (transition) => {
          transition.duration(300).attr('opacity', 0).remove();
        },
      },
    });

    // ---------- Layer 3: bars ----------
    const barsGroup = chart.append('g').attr('class', 'bars');

    this.layer('bars', barsGroup as unknown as D3Selection, {
      dataBind: (selection, data) => {
        return selection
          .selectAll('rect')
          .data(data, (d: any) => d.label) as unknown as D3Selection;
      },
      insert: (selection) => {
        return selection.append('rect') as unknown as D3Selection;
      },
      events: {
        enter: (selection) => {
          selection
            .attr('x', (d: any) => this.xScale(d.label)!)
            .attr('width', this.xScale.bandwidth())
            .attr('y', this.innerHeight)
            .attr('height', 0)
            .attr('rx', 2)
            .attr('fill', 'var(--vp-c-brand-1)');
        },
        'enter:transition': (transition) => {
          transition
            .duration(750)
            .attr('y', (d: any) => this.yScale(d.value))
            .attr('height', (d: any) => this.innerHeight - this.yScale(d.value));
        },
        'merge:transition': (transition) => {
          transition
            .duration(750)
            .attr('x', (d: any) => this.xScale(d.label)!)
            .attr('width', this.xScale.bandwidth())
            .attr('y', (d: any) => this.yScale(d.value))
            .attr('height', (d: any) => this.innerHeight - this.yScale(d.value));
        },
        'exit:transition': (transition) => {
          transition.duration(300).attr('opacity', 0).remove();
        },
      },
    });
  }

  protected preDraw(data: BarDatum[]): void {
    const width = this.config('width') as number;
    const height = this.config('height') as number;
    const margin = this.config('margin') as Margin;

    this.innerWidth = width - margin.left - margin.right;
    this.innerHeight = height - margin.top - margin.bottom;

    this.xScale.domain(data.map((d) => d.label)).range([0, this.innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.value) ?? 0]).range([this.innerHeight, 0]);
  }
}

const datasets: BarDatum[][] = [
  [
    { label: 'A', value: 30 },
    { label: 'B', value: 86 },
    { label: 'C', value: 168 },
    { label: 'D', value: 47 },
  ],
  [
    { label: 'A', value: 80 },
    { label: 'B', value: 50 },
    { label: 'C', value: 120 },
    { label: 'D', value: 200 },
    { label: 'E', value: 65 },
  ],
  [
    { label: 'B', value: 140 },
    { label: 'C', value: 10 },
    { label: 'D', value: 90 },
    { label: 'E', value: 175 },
    { label: 'F', value: 60 },
  ],
];

const container = ref<HTMLElement>();
let chart: MultiLayerBarChart | null = null;
let datasetIndex = 0;
let intervalId: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  if (!container.value) return;

  const svg = select(container.value)
    .append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    .style('max-width', '100%')
    .style('height', 'auto');

  chart = new MultiLayerBarChart(svg as unknown as D3Selection);
  chart.draw(datasets[0]);

  intervalId = setInterval(() => {
    datasetIndex = (datasetIndex + 1) % datasets.length;
    chart?.draw(datasets[datasetIndex]);
  }, 2500);
});

onUnmounted(() => {
  clearInterval(intervalId);
  chart?.destroy();
});
</script>

<template>
  <div class="chart-demo">
    <div ref="container" class="chart-container" />
    <p class="chart-caption">
      Live preview — three layers (y-axis, x-axis, bars) each manage their own data-join
    </p>
  </div>
</template>

<style scoped>
.chart-demo {
  margin: 24px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
.chart-container {
  padding: 16px;
  display: flex;
  justify-content: center;
  background: var(--vp-c-bg-soft);
}
.chart-container :deep(svg) {
  font-family: var(--vp-font-family-base);
  font-size: 12px;
}
.chart-container :deep(.tick line),
.chart-container :deep(.gridline) {
  stroke: var(--vp-c-text-3);
}
.chart-container :deep(.tick text) {
  fill: var(--vp-c-text-2);
}
.chart-caption {
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--vp-c-text-3);
  border-top: 1px solid var(--vp-c-divider);
  text-align: center;
}
</style>
