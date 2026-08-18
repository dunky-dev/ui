# SPEC / Solid / useFocusTrap

The Solid binding of the
[DOM focus-trap spec](../../../dom/utils/focus-trap/SPEC.md) — the trap
behavior is framework-free; this primitive owns only the Solid lifecycle.

## Install

```sh
npm install @dunky.dev/solid-use-focus-trap
```

## Usage

```tsx
import { isTopmostLayer } from '@dunky.dev/dom-overlay'
import { useFocusTrap } from '@dunky.dev/solid-use-focus-trap'

function DialogContent(props: { id: string }) {
  let panel: HTMLDivElement | undefined
  // `enabled` follows runtime state — here, only the overlay stack's
  // topmost layer traps.
  useFocusTrap(() => panel ?? null, { enabled: () => isTopmostLayer(props.id) })
  return (
    <div ref={panel} role='dialog'>
      ...
    </div>
  )
}
```

Solid-specific notes on top of the DOM contract:

- The target is an accessor, not a ref object: call the primitive from the
  component that renders the container. A plain ref variable fills during
  render, before effects run, so the trap binds when the component mounts
  and releases when its owner is disposed. A reactive accessor (a signal)
  re-arms the trap on a new element.
- Options are read through the closure on each Tab press, so inline
  `enabled` / `last` see the latest state without re-binding the listener —
  the per-press re-evaluation the DOM contract promises.

## API

### `useFocusTrap(target, options?)`

Returns nothing — the trap lives and dies with the owner.

| Param     | Type                                     | Default | Description                                                                            |
| --------- | ---------------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| `target`  | `() => HTMLElement \| null \| undefined` | —       | Accessor for the container to trap Tab / Shift+Tab within.                             |
| `options` | `UseFocusTrapOptions`                    | `{}`    | The DOM trap's options: `enabled?: () => boolean`, `last?: () => HTMLElement \| null`. |
