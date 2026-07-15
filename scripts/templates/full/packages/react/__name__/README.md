# @dunky.dev/react-__name__

React binding for [`@dunky.dev/__name__`](../../core/__name__): `use__Name__()`
wraps the framework-free [`@dunky.dev/dom-__name__`](../../dom/__name__) driver —
a ref callback for attach/detach and an effect that re-syncs options every
render so inline callbacks stay fresh.

Behavior contract: [`../../core/__name__/SPECS.md`](../../core/__name__/SPECS.md).
Hook-specific guarantees: [SPECS.md](./SPECS.md).

## Usage

```tsx
import { use__Name__ } from '@dunky.dev/react-__name__'

function Component() {
  const { ref } = use__Name__({ onActivate: () => {} })
  return <button ref={ref}>go</button>
}
```

Vue, Solid, and Svelte don't need a package — the driver maps directly onto a
composable / signals / a `use:` action; canonical patterns live in
[`sandbox/`](../../../sandbox).
