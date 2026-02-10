# Attachments

Attachments let you compose charts by nesting one chart inside another. When the parent chart draws, all attached sub-charts draw with the same data.

## Attaching a Sub-Chart

Use `attach(name, chart)` to register a sub-chart:

```ts
import { select } from 'd3-selection';
import type { D3Selection } from 'd3compose';

const root = select('#app') as unknown as D3Selection;

const main = new MainChart(root);
const legend = new LegendChart(root.append('div') as unknown as D3Selection);

main.attach('legend', legend);

// Drawing main also draws the legend
await main.draw(data);
```

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
class Dashboard extends D3Compose<DashboardData> {
  protected initialize(): void {
    // Both sub-charts receive DashboardData
    const header = new HeaderChart(this.base.append('div') as unknown as D3Selection);
    const body = new BodyChart(this.base.append('div') as unknown as D3Selection);

    this.attach('header', header);
    this.attach('body', body);
  }
}
```

### Independent Configuration

Each attached chart maintains its own config:

```ts
const main = new BarChart(root);
const mini = new BarChart(root.append('div') as unknown as D3Selection);

mini.config({ width: 200, height: 100 });

main.attach('minimap', mini);
```

## Cleanup

Calling `destroy()` on the parent clears all attachments (and layers):

```ts
main.destroy();
```
