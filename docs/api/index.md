# API Reference

This section contains the auto-generated API reference for d3-blueprint, plus this hand-written overview.

## Core Classes

### [D3Blueprint](/api/d3compose.d3compose)

The base class for all charts. Subclass it, define layers in `initialize()`, and call `draw(data)` to render. Provides lifecycle hooks (`transform`, `preDraw`, `postDraw`, `postTransition`), config management, event dispatch, and attachment composition.

### [Layer](/api/d3compose.layer)

Manages a single D3 data-join lifecycle. Created via `chart.layer(name, selection, options)`. Handles data binding, element insertion, and ordered lifecycle events (enter, update, merge, exit) with transition support.

### [ConfigManager](/api/d3compose.configmanager)

Manages named configuration properties with optional getter/setter transforms. Used internally by `D3Blueprint`, but you typically interact with it through `chart.config()` and `chart.configDefine()`.

## Key Types

| Type | Description |
|---|---|
| [D3Selection](/api/d3compose.d3selection) | Generic D3 selection type |
| [D3Transition](/api/d3compose.d3transition) | Generic D3 transition type |
| [LayerOptions](/api/d3compose.layeroptions) | Options for creating a layer (`dataBind`, `insert`, `events`) |
| [LayerEventMap](/api/d3compose.layereventmap) | Map of lifecycle event keys to handler functions |
| [LifecycleHandler](/api/d3compose.lifecyclehandler) | Handler for non-transition lifecycle phases |
| [TransitionHandler](/api/d3compose.transitionhandler) | Handler for `:transition` lifecycle phases |
| [ConfigDefineOptions](/api/d3compose.configdefineoptions) | Options for `configDefine()` (`defaultValue`, `getter`, `setter`) |

## Constants and Utilities

| Export | Description |
|---|---|
| [LIFECYCLE_EVENT_NAMES](/api/d3compose.lifecycle_event_names) | `['update', 'enter', 'merge', 'exit']` |
| [isValidLifecycleEvent](/api/d3compose.isvalidlifecycleevent) | Type guard for lifecycle event keys |
| [assertLifecycleEvent](/api/d3compose.assertlifecycleevent) | Assertion for lifecycle event keys |
