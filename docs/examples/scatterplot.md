# Scatterplot

A color-coded scatterplot with three groups. Uses a reusable [AxisChart](./reusable-components.md) for axes and a legend layer to label the color categories.

## Live Preview

<ClientOnly>
  <ScatterplotDemo />
</ClientOnly>

## Full Source

```js
import { select } from 'd3-selection';
import { D3Blueprint } from 'd3-blueprint';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { max } from 'd3-array';
import { AxisChart } from './charts/AxisChart.js';
import { tooltipPlugin } from './plugins/Tooltip.js';

const COLORS = ['steelblue', '#e45858', '#50a060'];
const GROUPS = ['Group A', 'Group B', 'Group C'];
const MARGIN = { top: 20, right: 20, bottom: 30, left: 45 };

class Scatterplot extends D3Blueprint {
  initialize() {
    this.xScale = scaleLinear();
    this.yScale = scaleLinear();
    this.colorScale = scaleOrdinal().domain(GROUPS).range(COLORS);

    this.chart = this.base
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    this.attach('axes', AxisChart, this.chart);

    // Layer 1: dots
    const dotsGroup = this.chart.append('g').attr('class', 'dots');

    this.layer('dots', dotsGroup, {
      dataBind: (selection, data) => {
        return selection.selectAll('circle').data(data, (d, i) => i);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          selection
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.y))
            .attr('r', 0)
            .attr('fill', (d) => this.colorScale(d.group))
            .attr('fill-opacity', 0.7);
        },
        'enter:transition': (transition) => {
          transition.duration(600).attr('r', 4);
        },
        'merge:transition': (transition) => {
          transition
            .duration(800)
            .attr('r', 4)
            .attr('cx', (d) => this.xScale(d.x))
            .attr('cy', (d) => this.yScale(d.y))
            .attr('fill', (d) => this.colorScale(d.group));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
        },
      },
    });

    // Layer 2: legend
    const legendGroup = this.chart.append('g').attr('class', 'legend');

    this.layer('legend', legendGroup, {
      dataBind: (selection) => {
        return selection.selectAll('g.legend-item').data(GROUPS);
      },
      insert: (selection) => {
        const g = selection.append('g').attr('class', 'legend-item');
        g.append('circle');
        g.append('text');
        return g;
      },
      events: {
        merge: (selection) => {
          selection.attr('transform', (d, i) => `translate(${i * 90}, ${-10})`);
          selection.select('circle')
            .attr('r', 5)
            .attr('cy', 0)
            .attr('fill', (d) => this.colorScale(d));
          selection.select('text')
            .attr('x', 10)
            .attr('dy', '0.35em')
            .attr('font-size', '11px')
            .text((d) => d);
        },
      },
    });

    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;
    this.tooltip = tooltipPlugin(this.chart);
  }

  preDraw(data) {
    const innerWidth = 600 - MARGIN.left - MARGIN.right;
    const innerHeight = 400 - MARGIN.top - MARGIN.bottom;

    this.xScale.domain([0, max(data, (d) => d.x) * 1.1]).range([0, innerWidth]);
    this.yScale.domain([0, max(data, (d) => d.y) * 1.1]).range([innerHeight, 0]);

    this.attached.axes.config({
      xScale: this.xScale,
      yScale: this.yScale,
      innerWidth,
      innerHeight,
      duration: 800,
      xTickCount: 6,
      yTickCount: 6,
    });
  }

  postDraw() {
    const tooltip = this.tooltip;
    const xScale = this.xScale;
    const yScale = this.yScale;

    this.chart.selectAll('.dots circle')
      .on('mouseenter', function (event, d) {
        select(this).attr('r', 6).attr('fill-opacity', 1);
        tooltip.show(
          xScale(d.x),
          yScale(d.y),
          [{ text: d.group, color: '#fff' }, { text: `(${d.x.toFixed(1)}, ${d.y.toFixed(1)})` }],
        );
      })
      .on('mouseleave', function () {
        select(this).attr('r', 4).attr('fill-opacity', 0.7);
        tooltip.hide();
      });
  }
}
```

## Usage

```js
import { select } from 'd3-selection';

const chart = new Scatterplot(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

// Generate clustered data for three groups
const data = [];
['Group A', 'Group B', 'Group C'].forEach((group, gi) => {
  const cx = 30 + gi * 30;
  const cy = 30 + gi * 20;
  for (let i = 0; i < 25; i++) {
    data.push({
      x: cx + (Math.random() - 0.5) * 50,
      y: cy + (Math.random() - 0.5) * 40,
      group,
    });
  }
});

await chart.draw(data);
```

## Key Takeaways

- **Each dot is a datum**: the `dots` layer binds the full array, so every circle participates in the enter/update/exit lifecycle independently.
- **`scaleOrdinal` assigns colors by group**: consistent color mapping across redraws.
- **Legend as a layer**: the legend is a d3-blueprint layer, not a static element. It draws once from the `GROUPS` constant and participates in the same lifecycle.
- **AxisChart handles axis rendering**: the parent configures it with scales and tick counts in `preDraw()`.
- **Hover effects in `postDraw()`**: since layers only support lifecycle events, DOM mouse events are wired via D3's `.on()` after the draw completes.
