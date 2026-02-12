# Events

d3-blueprint has two levels of events: **chart-level** events on `D3Blueprint` and **layer-level** lifecycle events on `Layer`.

## Chart-Level Events

Chart-level events fire during the draw lifecycle. Register listeners with `.on()` and remove them with `.off()`:

```ts
chart.on('preDraw', (data) => {
  console.log('About to draw with', data);
});

chart.on('postDraw', (data) => {
  console.log('Layers have drawn');
});

chart.on('postTransition', (data) => {
  console.log('All transitions complete');
});
```

<ClientOnly>
  <GuideEventsDemo />
</ClientOnly>

### Available Events

| Event | Timing |
|---|---|
| `preDraw` | After `transform()`, before layers draw |
| `postDraw` | After layers draw, before transitions complete |
| `postTransition` | After all transitions have completed |

### Namespace Support

Events support d3-dispatch namespaces for registering multiple listeners:

```ts
chart.on('postDraw.tooltip', updateTooltip);
chart.on('postDraw.legend', updateLegend);

// Remove just the tooltip listener
chart.off('postDraw.tooltip');
```

### Removing Listeners

```ts
chart.off('postDraw');           // Remove all postDraw listeners
chart.off('postDraw.tooltip');   // Remove namespaced listener
```

## Layer-Level Events

Layer lifecycle events are the data-join phases: `update`, `enter`, `merge`, `exit`, and their `:transition` variants.

These are typically registered in the layer's `events` option:

```ts
this.layer('bars', selection, {
  dataBind(sel, data) { /* ... */ },
  insert(sel) { /* ... */ },
  events: {
    enter: (sel) => sel.attr('opacity', 0),
    'enter:transition': (t) => t.duration(500).attr('opacity', 1),
    merge: (sel) => sel.attr('fill', 'steelblue'),
    'exit:transition': (t) => t.duration(300).attr('opacity', 0).remove(),
  },
});
```

Or added after creation:

```ts
const layer = this.layer('bars');
layer.on('merge', (sel) => sel.attr('fill', 'red'));
```

See [Layers](./layers.md) for the full lifecycle event reference.

## LIFECYCLE_EVENT_NAMES

The valid base lifecycle event names are exported as a constant:

```ts
import { LIFECYCLE_EVENT_NAMES } from 'd3-blueprint';

console.log(LIFECYCLE_EVENT_NAMES);
// ['update', 'enter', 'merge', 'exit']
```

## Type Guards

Use `isValidLifecycleEvent()` to check if a string is a valid lifecycle event key:

```ts
import { isValidLifecycleEvent } from 'd3-blueprint';

isValidLifecycleEvent('enter');            // true
isValidLifecycleEvent('enter:transition'); // true
isValidLifecycleEvent('click');            // false
```

Use `assertLifecycleEvent()` to throw if a string is invalid:

```ts
import { assertLifecycleEvent } from 'd3-blueprint';

assertLifecycleEvent('enter');   // OK
assertLifecycleEvent('invalid'); // throws Error
```
