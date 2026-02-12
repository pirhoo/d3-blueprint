# Config

d3-blueprint provides a configuration system for defining typed properties with optional getter/setter transforms. This enables a consistent, chainable API for all charts.

<ClientOnly>
  <GuideConfigDemo />
</ClientOnly>

## Defining Config Properties

Define config properties in your chart's `initialize()` method using `this.configDefine()`:

```ts
protected initialize(): void {
  this.configDefine('width', {
    defaultValue: 600,
  });

  this.configDefine('height', {
    defaultValue: 400,
  });

  this.configDefine('margin', {
    defaultValue: { top: 20, right: 20, bottom: 30, left: 40 },
  });
}
```

## Getter and Setter Transforms

You can provide `getter` and `setter` functions that transform values when reading or writing:

```ts
this.configDefine('color', {
  defaultValue: '#steelblue',
  setter: (value) => {
    // Validate on write
    if (!value.startsWith('#')) {
      throw new Error('Color must be a hex string');
    }
    return value;
  },
});

this.configDefine('radius', {
  defaultValue: 5,
  getter: (value) => Math.max(0, value),  // Always return non-negative
  setter: (value) => Math.round(value),     // Store as integer
});
```

## Reading Config Values

Use `this.config(name)` to read a value:

```ts
const width = this.config('width');   // 600
const margin = this.config('margin'); // { top: 20, ... }
```

## Setting Config Values

Set a single value. Returns `this` for chaining:

```ts
chart
  .config('width', 800)
  .config('height', 500);
```

Set multiple values with an object:

```ts
chart.config({
  width: 800,
  height: 500,
  margin: { top: 10, right: 10, bottom: 20, left: 30 },
});
```

## Using Config in Lifecycle Hooks

A common pattern is reading config values in `preDraw()` to set up scales:

```ts
protected preDraw(data: Datum[]): void {
  const width = this.config('width') as number;
  const height = this.config('height') as number;
  const margin = this.config('margin') as Margin;

  this.innerWidth = width - margin.left - margin.right;
  this.innerHeight = height - margin.top - margin.bottom;

  this.xScale.range([0, this.innerWidth]);
  this.yScale.range([this.innerHeight, 0]);
}
```

## ConfigManager

Under the hood, config properties are managed by `ConfigManager`. While you typically interact with config through the `D3Blueprint` methods (`config()` and `configDefine()`), the `ConfigManager` class is also exported for advanced use cases.

See the [API Reference](/api/d3-blueprint.configmanager) for full details.
