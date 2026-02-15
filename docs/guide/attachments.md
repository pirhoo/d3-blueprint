# Attachments

Attachments let you compose charts by nesting one chart inside another. When the parent chart draws, all attached sub-charts draw with the same data.

## Attaching a Sub-Chart

Use `attach(name, ChartClass, base)` to register a sub-chart. The parent instantiates the component for you and stores it on `this.attached`:

```ts
import { select } from 'd3-selection';
import type { D3Selection } from 'd3-blueprint';

const root = select('#app') as unknown as D3Selection;

const main = new MainChart(root);
main.attach('legend', LegendChart, root.append('div') as unknown as D3Selection);

// Drawing main also draws the legend
await main.draw(data);
```

::: info Legacy API
The two-argument form `attach(name, chartInstance)` is still supported for backwards compatibility, but the three-argument form above is preferred.
:::

<ClientOnly>
  <GuideAttachmentsDemo />
</ClientOnly>

## How It Works

During the parent's `draw()` lifecycle, attached charts are drawn after the parent's own layers:

```
draw(data)
  ├── transform(data)
  ├── preDraw(transformedData)
  ├── layers.draw(transformedData)
  ├── attachments.draw(transformedData)  ← sub-charts draw here
  ├── postDraw(transformedData)
  └── ...
```

Each attachment's `draw()` method is called with the same transformed data. Their transitions are awaited together with the parent's layer transitions.

## Composition Patterns

### Shared Data Type

Attached charts must accept the same data type as the parent:

```ts
class Dashboard extends D3Blueprint<DashboardData> {
  protected initialize(): void {
    // Both sub-charts receive DashboardData
    this.attach('header', HeaderChart, this.base.append('div') as unknown as D3Selection);
    this.attach('body', BodyChart, this.base.append('div') as unknown as D3Selection);
  }
}
```

### Independent Configuration

Each attached chart maintains its own config:

```ts
const main = new BarChart(root);
main.attach('minimap', BarChart, root.append('div') as unknown as D3Selection);

main.attached.minimap.config({ width: 200, height: 100 });
```

## Real-World Example

See the [Reusable Components](/examples/reusable-components) example for a complete walkthrough of `AxisChart` and `BarsChart` composed via `attach()`. Every chart example in this documentation uses this pattern.

## Cleanup

Calling `destroy()` on the parent clears all attachments (and layers):

```ts
main.destroy();
```
