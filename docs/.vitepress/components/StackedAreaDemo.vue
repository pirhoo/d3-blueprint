<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select, pointer } from 'd3-selection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { max } from 'd3-array';
import { stack, area, curveCatmullRom } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { Tooltip } from './charts/Tooltip.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 80, bottom: 30, left: 45 };
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060'];
const KEYS = ['Desktop', 'Mobile', 'Tablet'];
const POINT_COUNT = 12;

function randomDataset() {
  return Array.from({ length: POINT_COUNT }, (_, i) => ({
    x: i,
    Desktop: 20 + Math.round(Math.random() * 40),
    Mobile: 10 + Math.round(Math.random() * 30),
    Tablet: 5 + Math.round(Math.random() * 15),
  }));
}

class StackedAreaChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().domain(KEYS).range(COLORS);
    this.areaFn = area().curve(curveCatmullRom);
    this.stacked = [];

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    const areasGroup = this.chart.append('g').attr('class', 'areas');

    this.layer('areas', areasGroup, {
      dataBind: (selection) => {
        return selection.selectAll('path').data(this.stacked, (d) => d.key);
      },
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', (d) => this.colorScale(d.key))
            .attr('fill-opacity', 0.7)
            .attr('d', (d) => this.areaFn(d));
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('fill', (d) => this.colorScale(d.key))
            .attr('d', (d) => this.areaFn(d));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Inline labels
    const labelsGroup = this.chart.append('g').attr('class', 'labels');

    this.layer('labels', labelsGroup, {
      dataBind: (selection) => {
        return selection.selectAll('text').data(KEYS);
      },
      insert: (selection) => selection.append('text'),
      events: {
        merge: (selection) => {
          selection
            .attr('dy', '0.35em')
            .attr('font-size', '11px')
            .attr('font-weight', '500')
            .attr('fill', (d) => this.colorScale(d))
            .text((d) => d);
          this._positionLabels(selection);
        },
      },
    });

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.crosshair = this.chart
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#999')
      .attr('stroke-dasharray', '4,3')
      .style('display', 'none');

    this.overlay = this.chart
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .style('pointer-events', 'all');

    this.usePlugin(new Tooltip(this.chart, (chart, tooltip, data) => {
        chart.overlay
          .on('mousemove', function (event) {
            const [mx] = pointer(event, this);
            const idx = Math.max(0, Math.min(Math.round(chart.xScale.invert(mx)), data.length - 1));
            const cx = chart.xScale(idx);

            chart.crosshair.attr('x1', cx).attr('x2', cx).style('display', null);

            const lines = KEYS.map((key) => ({
              text: `${key}: ${data[idx][key]}`,
              color: chart.colorScale(key),
            }));
            tooltip.show(cx, chart.yScale(data[idx].Desktop + data[idx].Mobile + data[idx].Tablet), lines);
          })
          .on('mouseleave', () => {
            chart.crosshair.style('display', 'none');
            tooltip.hide();
          });
      }
    ));
  }

  _positionLabels(sel) {
    const lastIdx = this.stacked[0]?.length - 1;
    if (lastIdx == null) return;

    sel.each((key, i, nodes) => {
      const series = this.stacked.find((s) => s.key === key);
      if (!series) return;
      const d = series[lastIdx];
      const midY = (this.yScale(d[0]) + this.yScale(d[1])) / 2;
      select(nodes[i])
        .attr('x', this.xScale(lastIdx) + 8)
        .attr('y', midY);
    });
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.stacked = stack().keys(KEYS)(data);
    const maxVal = max(this.stacked[this.stacked.length - 1], (d) => d[1]);

    this.xScale.domain([0, data.length - 1]).range([0, innerWidth]);
    this.yScale.domain([0, maxVal * 1.05]).range([innerHeight, 0]);

    this.areaFn
      .x((d) => this.xScale(d.data.x))
      .y0((d) => this.yScale(d[0]))
      .y1((d) => this.yScale(d[1]));

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 800,
      xTickCount: 6,
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

  chart = new StackedAreaChart(svg);
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
      Live preview: three stacked series, regenerated every 3.5 s
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
