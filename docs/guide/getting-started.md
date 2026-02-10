# Getting Started

## Installation

```bash
npm install d3compose d3-selection
```

d3compose has peer-like dependencies on `d3-selection` and `d3-transition`. Install them alongside d3compose.

## Your First Chart

Every d3compose chart is a class that extends `D3Compose`. You define layers in `initialize()`, then call `draw(data)` to render.

```ts
import { D3Compose } from 'd3compose';
import { select } from 'd3-selection';
import type { D3Selection } from 'd3compose';

interface Datum {
  label: string;
  value: number;
}

class SimpleList extends D3Compose<Datum[]> {
  protected initialize(): void {
    const list = this.base.append('ul');

    this.layer('items', list as unknown as D3Selection, {
      dataBind(selection, data) {
        return selection.selectAll('li').data(data) as unknown as D3Selection;
      },
      insert(selection) {
        return selection.append('li') as unknown as D3Selection;
      },
      events: {
        merge: (selection) => {
          selection.text((d: any) => `${d.label}: ${d.value}`);
        },
      },
    });
  }
}

const chart = new SimpleList(select('#app') as unknown as D3Selection);

chart.draw([
  { label: 'Apples', value: 10 },
  { label: 'Bananas', value: 7 },
  { label: 'Cherries', value: 15 },
]);
```

## What's Next

- [Core Concepts](./core-concepts.md) — understand the subclassing pattern and full draw lifecycle
- [Layers](./layers.md) — deep dive into data-join lifecycle management
- [Config](./config.md) — define typed configuration properties for your chart
