# Contributing

## Development Setup

```bash
git clone https://github.com/pirhoo/d3-blueprint.git
cd d3-blueprint
make install
```

## Available Commands

| Command | Description |
|---|---|
| `make help` | Show all available targets |
| `make install` | Install dependencies |
| `make build` | Compile TypeScript |
| `make test` | Run tests |
| `make lint` | Run ESLint |
| `make lint-fix` | Run ESLint with auto-fix |
| `make docs-dev` | Start VitePress dev server |
| `make docs-build` | Build documentation site |
| `make docs-api` | Generate API reference from source |
| `make clean` | Remove build artifacts |

## Coding Conventions

- **TypeScript**: all source code is in `src/` with strict mode enabled
- **Small files**: split code into small, focused modules
- **Small functions**: prefer functions under 10 lines
- **Explicit names**: use descriptive function and variable names
- **Shorthand properties**: prefer `{ foo }` over `{ foo: foo }`
- **No inline `if`**: use block `if` statements
- **Composable functions**: prefer pure, composable functions
- **JSDoc**: document public API with JSDoc comments
- **Tests alongside source**: test files live next to source files as `*.test.ts`
- **lodash-es**: use lodash for common array/object manipulations (tree-shaken)

## Project Structure

```
src/
  config/           # ConfigManager and config utilities
  layer/            # Layer class and lifecycle events
  types/            # Shared TypeScript type definitions
  utils/            # Assertion and general utilities
  d3-blueprint.ts   # Main D3Blueprint base class
  index.ts          # Public API exports
```

## Testing

Tests use Jest with jsdom and live alongside source files:

```bash
make test
```

## Linting

Code is linted with ESLint and Stylistic:

```bash
make lint
make lint-fix
```

## Documentation

The docs site uses VitePress. API reference pages are auto-generated from JSDoc comments using `@microsoft/api-extractor` and `@microsoft/api-documenter`.

```bash
make docs-dev    # Local dev server
make docs-api    # Regenerate API docs
make docs-build  # Full production build
```

## Pull Request Guidelines

1. Create a feature branch from `main`
2. Make small, focused commits
3. Ensure `make lint && make test && make build` passes
4. Open a PR against `main`
