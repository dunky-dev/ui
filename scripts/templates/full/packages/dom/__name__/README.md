# @dunky.dev/dom-__name__

The vanilla DOM driver for [`@dunky.dev/__name__`](../../core/__name__):
`create__Name__()` binds one element, wires its listeners, translates raw
browser events into machine events, and owns the browser-quirk workarounds.
Framework-free — the React/Vue/Solid/Svelte bindings are thin wrappers over
this one driver.

The behavior it implements is specified in
[`../../core/__name__/SPEC.md`](../../core/__name__/SPEC.md); this package's
own [SPEC.md](./SPEC.md) covers the driver contract (instance lifecycle,
event wiring, what lives here vs in the machine).

## How the package works

```
src/
  create-__name__.ts   the driver factory (instance lifecycle + event wiring)
tests/
  create-__name__.test.ts   jsdom wiring tests
```

## Usage

```ts
import { create__Name__ } from '@dunky.dev/dom-__name__'

const instance = create__Name__({ onActivate: () => console.log('activated') })
instance.attach(button)
// later:
instance.setOptions({ ...options, disabled: true }) // cancels an in-flight interaction
instance.detach()
```

Canonical framework wrappers (Vue composable, Solid signals, Svelte action)
live in [`sandbox/`](../../../sandbox).
