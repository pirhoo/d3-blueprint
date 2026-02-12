# Core Concepts

## What is d3-blueprint?

d3-blueprint (pronounced "decompose") is a modern micro-framework for building reusable D3 charts. It's heavily inspired by [Koto.js](https://github.com/kotojs/kotojs) and leverages ES6 classes and TypeScript to offer a friendly experience when building charts.

## The Subclassing Pattern

Every chart extends `D3Blueprint`. The constructor receives a D3 selection (the root element), and you override lifecycle hooks to define behavior:

```ts
import { D3Blueprint } from 'd3-blueprint';

class MyChart extends D3Blueprint<MyData> {
  protected initialize(): void {
    // Set up layers, configs, DOM structure
  }

  protected transform(data: MyData): MyData {
    // Transform data before drawing
    return data;
  }

  protected preDraw(data: MyData): void {
    // Runs before layers draw
  }

  protected postDraw(data: MyData): void {
    // Runs after layers draw (before transitions complete)
  }

  protected postTransition(data: MyData): void {
    // Runs after all transitions have completed
  }
}
```

## Draw Lifecycle

When you call `chart.draw(data)`, the following sequence executes:

```
constructor(selection)
  └── initialize()

draw(data)
  ├── transform(data) → transformedData
  ├── preDraw(transformedData)
  ├── emit "preDraw" event
  ├── layers.draw(transformedData)    ← each layer runs its data-join lifecycle
  ├── attachments.draw(transformedData)
  ├── postDraw(transformedData)
  ├── emit "postDraw" event
  ├── await all transitions
  ├── postTransition(transformedData)
  └── emit "postTransition" event
```

<ClientOnly>
  <GuideLifecycleDemo />
</ClientOnly>

### Phase Details

| Phase | Purpose |
|---|---|
| `initialize()` | Called once during construction. Set up layers, configs, and DOM scaffolding. |
| `transform(data)` | Transform or filter incoming data. Return the modified data. |
| `preDraw(data)` | Update scales, axes, or other state before layers render. |
| Layer draw | Each layer runs its data-join: `dataBind` → `insert` → enter/update/merge/exit handlers. |
| Attachment draw | Sub-charts attached via `attach()` are drawn with the same data. |
| `postDraw(data)` | Clean up or add decorations after layers render but before transitions finish. |
| `postTransition(data)` | Runs after all D3 transitions have completed. |

## Public API

All charts share a consistent public API:

```ts
const chart = new MyChart(selection);

// Configure
chart
  .config('width', 500)
  .config('height', 300);

// Or configure with an object
chart.config({ width: 500, height: 300 });

// Draw
await chart.draw(data);

// Listen to lifecycle events
chart.on('postDraw', (data) => {
  console.log('Chart rendered');
});

// Destroy
chart.destroy();
```
