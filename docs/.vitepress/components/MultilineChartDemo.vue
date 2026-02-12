<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select, pointer } from 'd3-selection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { max } from 'd3-array';
import { line, curveCatmullRom } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from '../plugins/tooltipPlugin.js';

const WIDTH = 500;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 80, bottom: 30, left: 45 };
const COLORS = ['var(--vp-c-brand-1)', '#e45858', '#50a060'];
const POINT_COUNT = 20;
const SERIES_NAMES = ['Product A', 'Product B', 'Product C'];

function randomSeries() {
  return SERIES_NAMES.map((name) => {
    const values = [];
    let value = 40 + Math.random() * 60;
    for (let i = 0; i < POINT_COUNT; i++) {
      value = Math.max(5, Math.min(200, value + (Math.random() - 0.5) * 35));
      values.push({ x: i, value: Math.round(value) });
    }
    return { name, values };
  });
}

class MultilineChart extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().range(COLORS);
    this.lineFn = line().curve(curveCatmullRom);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.axes = new AxisChart(this.chart);
    this.attach('axes', this.axes);

    // Layer 1: one path per series
    const linesGroup = this.chart.append('g').attr('class', 'lines');

    this.layer('lines', linesGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('path').data(data, (d) => d.name);
      },
      insert: (selection) => {
        return selection.append('path');
      },
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'none')
            .attr('stroke', (d) => this.colorScale(d.name))
            .attr('stroke-width', 2)
            .attr('d', (d) => this.lineFn(d.values));
        },
        'enter:transition': (transition) => {
          transition.duration(800);
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('stroke', (d) => this.colorScale(d.name))
            .attr('d', (d) => this.lineFn(d.values));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Layer 2: legend labels at the end of each line
    const labelsGroup = this.chart.append('g').attr('class', 'labels');

    this.layer('labels', labelsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('text').data(data, (d) => d.name);
      },
      insert: (selection) => {
        return selection.append('text');
      },
      events: {
        enter: (selection) => {
          selection
            .attr('dy', '0.35em')
            .attr('font-size', '11px')
            .attr('font-weight', '500')
            .attr('fill', (d) => this.colorScale(d.name))
            .text((d) => d.name);
          this._positionLabels(selection);
        },
        'merge:transition': (transition) => {
          this._positionLabels(transition);
          transition.duration(800);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });

    // Crosshair + overlay for tooltip
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    this.crosshair = this.chart
      .append('line')
      .attr('class', 'crosshair')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#999')
      .attr('stroke-dasharray', '4,3')
      .attr('stroke-width', 1)
      .style('display', 'none');

    this.overlay = this.chart
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .style('pointer-events', 'all');

    this.usePlugin(tooltipPlugin({
      parent: this.chart,
      width: innerWidth,
      height: innerHeight,
      bind: (chart, tooltip, data) => {
        chart.overlay
          .on('mousemove', function (event) {
            const [mx] = pointer(event, this);
            const idx = Math.round(chart.xScale.invert(mx));
            const clamped = Math.max(0, Math.min(idx, POINT_COUNT - 1));
            const cx = chart.xScale(clamped);

            chart.crosshair.attr('x1', cx).attr('x2', cx).style('display', null);

            const lines = data.map((s) => ({
              text: `${s.name}: ${s.values[clamped].value}`,
              color: chart.colorScale(s.name),
            }));
            tooltip.show(cx, chart.yScale(data[0].values[clamped].value), lines);
          })
          .on('mouseleave', () => {
            chart.crosshair.style('display', 'none');
            tooltip.hide();
          });
      },
    }));
  }

  _positionLabels(sel) {
    sel
      .attr('x', (d) => {
        const last = d.values[d.values.length - 1];
        return this.xScale(last.x) + 8;
      })
      .attr('y', (d) => {
        const last = d.values[d.values.length - 1];
        return this.yScale(last.value);
      });
  }

  preDraw(data) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const allValues = data.flatMap((s) => s.values);

    this.xScale.domain([0, POINT_COUNT - 1]).range([0, innerWidth]);
    this.yScale.domain([0, max(allValues, (d) => d.value) * 1.1]).range([innerHeight, 0]);
    this.colorScale.domain(data.map((d) => d.name));

    this.lineFn
      .x((d) => this.xScale(d.x))
      .y((d) => this.yScale(d.value));

    this.axes.config({
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

  chart = new MultilineChart(svg);
  chart.draw(randomSeries());

  intervalId = setInterval(() => {
    chart?.draw(randomSeries());
  }, 3500);
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
      Live preview: three series with 20 random points each, regenerated every 3.5 s
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
.chart-container :deep(.tick line) {
  stroke: var(--vp-c-text-3);
  stroke-dasharray: 2,2;
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
