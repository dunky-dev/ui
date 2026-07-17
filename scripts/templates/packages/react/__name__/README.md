# @dunky.dev/react-__name__

React binding for [`@dunky.dev/__name__`](../../core/__name__): `use__Name__()`
drives the framework-free machine directly — a ref callback for attach/detach
that owns the element listeners, and an effect that re-syncs options every
render so inline callbacks stay fresh.

Behavior contract: [`../../core/__name__/SPEC.md`](../../core/__name__/SPEC.md).
Hook-specific guarantees: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-__name__
```

## Usage

```tsx
import { use__Name__ } from '@dunky.dev/react-__name__'

function Component() {
  const { ref } = use__Name__({ onActivate: () => {} })
  return <button ref={ref}>go</button>
}
```
