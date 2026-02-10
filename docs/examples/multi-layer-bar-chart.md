# Multi-Layer Bar Chart

This example builds the same bar chart as the [basic example](./bar-chart.md) but with **three independent layers**: y-axis ticks, x-axis ticks, and bars. Each layer owns its own data-join, so ticks enter/exit alongside the bars they represent.

## Live Preview

<ClientOnly>
  <MultiLayerBarChartDemo />
</ClientOnly>

## Why Multiple Layers?

In the basic bar chart, axes are rendered in `preDraw()` with `d3-axis`. That works, but the axis ticks bypass d3compose's lifecycle — they can't participate in enter/exit transitions alongside the bars.

By making axes their own layers:

- Tick labels **enter and exit** with smooth opacity transitions when the data changes
- Y-axis gridlines span the chart width and update with the scale
- Each layer is self-contained: you can remove or swap a layer without touching the others

## Full Source

```ts
import { D3Compose } from 'd3compose';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { format } from 'd3-format';
import type { D3Selection } from 'd3compose';

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

    this.configDefine('width', { defaultValue: 600 });
    this.configDefine('height', { defaultValue: 400 });
    this.configDefine('margin', {
      defaultValue: { top: 20, right: 20, bottom: 30, left: 45 } as Margin,
    });

    const margin = this.config('margin') as Margin;
    const chart = this.base
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // ---- Layer 1: y-axis (gridlines + tick labels) ----

    const yAxisGroup = chart.append('g').attr('class', 'y-axis');

    this.layer('y-axis', yAxisGroup as unknown as D3Selection, {
      // Bind tick values from the y-scale — not the chart data
      dataBind: (selection, _data) => {
        return selection
          .selectAll('.tick')
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
          // New ticks start invisible at their final position
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
          // Existing ticks slide to their new position
          transition
            .duration(600)
            .attr('opacity', 1)
            .attr('transform', (d: any) => `translate(0,${this.yScale(d)})`);
          // Update gridline width and label text (non-animated)
          transition.selection().select('line').attr('x2', this.innerWidth);
          transition.selection().select('text').text((d: any) => fmt(d));
        },
        'exit:transition': (transition) => {
          transition.duration(300).attr('opacity', 0).remove();
        },
      },
    });

    // ---- Layer 2: x-axis (tick labels) ----

    const xAxisGroup = chart.append('g').attr('class', 'x-axis');

    this.layer('x-axis', xAxisGroup as unknown as D3Selection, {
      // Bind the category labels extracted from the chart data
      dataBind: (selection, data) => {
        return selection
          .selectAll('.tick')
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
        },
        'exit:transition': (transition) => {
          transition.duration(300).attr('opacity', 0).remove();
        },
      },
    });

    // ---- Layer 3: bars ----

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
            .attr('fill', 'steelblue');
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
```

## Usage

```ts
import { select } from 'd3-selection';

const chart = new MultiLayerBarChart(
  select('#chart').append('svg').attr('width', 600).attr('height', 400),
);

await chart.draw([
  { label: 'A', value: 30 },
  { label: 'B', value: 86 },
  { label: 'C', value: 168 },
  { label: 'D', value: 47 },
]);
```

## Layer Anatomy

| Layer | `<g>` root | Binds | Elements per datum |
|---|---|---|---|
| `y-axis` | `.y-axis` | `yScale.ticks(5)` (derived from scale, not chart data) | `<g class="tick">` → `<line>` + `<text>` |
| `x-axis` | `.x-axis` | `data.map(d => d.label)` (category labels) | `<g class="tick">` → `<line>` + `<text>` |
| `bars` | `.bars` | `data` keyed by `d.label` | `<rect>` |

### Key Differences from the Basic Example

1. **No `d3-axis`** — tick marks are layers, so they follow the same enter/update/merge/exit lifecycle as bars.
2. **Y-axis derives its own data** — `dataBind` ignores the incoming `BarDatum[]` and uses `this.yScale.ticks()` instead. This is valid: `dataBind` receives the chart data but is free to bind any data it wants.
3. **Coordinated transitions** — when the dataset changes, old ticks fade out, new ticks fade in, and bars animate to their new positions — all managed independently by their layers.
4. **`declare` class fields** — properties set in `initialize()` use `declare` to prevent ES class field semantics from resetting them after the parent constructor runs.
