# Donut Chart

A donut chart with animated arc transitions. No axes are needed because this chart uses `d3-shape`'s `pie()` and `arc()` generators directly, with `attrTween` for smooth angular interpolation between data updates.

## Live Preview

<ClientOnly>
  <DonutChartDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleOrdinal } from 'd3-scale';
import { pie, arc } from 'd3-shape';
import { tooltipPlugin } from './plugins/Tooltip.js';

const WIDTH = 400;
const HEIGHT = 400;
const RADIUS = Math.min(WIDTH, HEIGHT) / 2;
const INNER_RADIUS = RADIUS * 0.55;
const COLORS = ['steelblue', '#e45858', '#50a060', '#e8a838', '#7c6bbf'];

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
            .attr('stroke', '#fff')
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
      .attr('font-size', '14px');

    this.tooltip = tooltipPlugin(this.chart);
  }

  preDraw(data) {
    this.colorScale.domain(data.map((d) => d.label));
    const total = data.reduce((sum, d) => sum + d.value, 0);
    this.centerLabel.text(`Total: ${total}`);
  }

  postDraw(data) {
    const tooltip = this.tooltip;
    const arcFn = this.arcFn;
    const hoverArc = this.hoverArc;
    const total = data.reduce((sum, d) => sum + d.value, 0);

    this.chart.selectAll('.slices path')
      .on('mouseenter', function (event, d) {
        select(this).transition().duration(100).attr('d', hoverArc);
        const pct = ((d.data.value / total) * 100).toFixed(1);
        const [cx, cy] = arcFn.centroid(d);
        tooltip.show(cx, cy, `${d.data.label}: ${d.data.value} (${pct}%)`);
      })
      .on('mouseleave', function () {
        select(this).transition().duration(100).attr('d', arcFn);
        tooltip.hide();
      });
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new DonutChart(
  select('#chart').append('svg').attr('width', 400).attr('height', 400),
);

await chart.draw([
  { label: 'React', value: 42 },
  { label: 'Vue', value: 28 },
  { label: 'Angular', value: 18 },
  { label: 'Svelte', value: 8 },
  { label: 'Other', value: 4 },
]);

// Update: arcs animate smoothly to new proportions
await chart.draw([
  { label: 'React', value: 38 },
  { label: 'Vue', value: 32 },
  { label: 'Angular', value: 14 },
  { label: 'Svelte', value: 12 },
  { label: 'Other', value: 4 },
]);
```

## Key Takeaways

- **No AxisChart needed**: donut charts have no axes, so this chart uses `D3Blueprint` directly without attaching an AxisChart.
- **`pie()` computes angles**: the pie layout transforms `{ label, value }` data into objects with `startAngle` and `endAngle` properties.
- **`arc()` draws paths**: the arc generator converts angle data into SVG path strings for the `<path>` elements.
- **`attrTween` interpolates arcs smoothly**: instead of interpolating the path string directly (which would distort), `attrTween` interpolates the angle values and recomputes the path at each frame.
- **Hover effect uses a larger arc**: `hoverArc` has a slightly larger outer radius, creating a subtle "pop" effect on mouseenter.
- **`_current` stores previous angles**: each DOM element remembers its last arc data so the next transition can interpolate from the correct starting position.
