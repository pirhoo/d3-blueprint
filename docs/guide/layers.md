# Layers

Layers are the core building block in d3compose. Each layer manages a D3 data-join lifecycle — binding data, inserting elements, and handling enter/update/merge/exit phases.

## Creating a Layer

Register layers in your chart's `initialize()` method using `this.layer(name, selection, options)`:

```ts
protected initialize(): void {
  const group = this.base.append('g').classed('bars', true);

  this.layer('bars', group as unknown as D3Selection, {
    dataBind(selection, data) {
      return selection.selectAll('rect').data(data) as unknown as D3Selection;
    },
    insert(selection) {
      return selection.append('rect') as unknown as D3Selection;
    },
    events: {
      enter: (selection) => {
        selection.attr('opacity', 0);
      },
      'enter:transition': (transition) => {
        transition.duration(500).attr('opacity', 1);
      },
    },
  });
}
```

## Layer Options

The `LayerOptions` object has three properties:

### `dataBind(selection, data)`

Binds data to the layer's selection. Must return a D3 data-join (the result of `.selectAll().data()`).

```ts
dataBind(selection, data) {
  return selection.selectAll('rect').data(data, d => d.id);
}
```

### `insert(selection)`

Appends new DOM elements for entering data points. Called on the enter selection.

```ts
insert(selection) {
  return selection.append('rect');
}
```

### `events`

An object mapping lifecycle event keys to handler functions. See [Lifecycle Events](#lifecycle-events) below.

## Lifecycle Events

Each layer fires events in this order during `draw()`:

| Event | Selection | Purpose |
|---|---|---|
| `update` | Existing elements matched to new data | Update attributes of existing elements |
| `enter` | Newly created elements | Set initial attributes on new elements |
| `merge` | Enter + update combined | Set attributes shared by new and existing elements |
| `exit` | Elements with no matching data | Remove or fade out old elements |

### Transition Events

Each event has a `:transition` variant that receives a D3 transition instead of a selection:

- `update:transition`
- `enter:transition`
- `merge:transition`
- `exit:transition`

Transition handlers let you animate changes:

```ts
events: {
  'merge': (selection) => {
    selection
      .attr('x', d => xScale(d.label))
      .attr('width', xScale.bandwidth());
  },
  'merge:transition': (transition) => {
    transition
      .duration(750)
      .attr('y', d => yScale(d.value))
      .attr('height', d => height - yScale(d.value));
  },
  'exit:transition': (transition) => {
    transition
      .duration(300)
      .attr('opacity', 0)
      .remove();
  },
}
```

## Registering Handlers After Creation

You can also add handlers after layer creation using `.on()`:

```ts
const layer = this.layer('bars');

layer.on('merge', (selection) => {
  selection.attr('fill', 'steelblue');
});
```

Remove handlers with `.off()`:

```ts
layer.off('merge', myHandler);  // Remove specific handler
layer.off('merge');              // Remove all handlers for this event
```

## Retrieving a Layer

Access a previously created layer by name:

```ts
const barsLayer = this.layer('bars');
```

## Transition Promises

`layer.draw(data)` returns a `Promise<void>` that resolves when all transitions have completed. The parent chart's `draw()` method awaits these promises before calling `postTransition()`.
