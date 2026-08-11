# SPEC / React / useFocusTrap

The React binding of the
[DOM focus-trap spec](../../../dom/utils/focus-trap/SPEC.md) — the trap
behavior is framework-free; this hook owns only the React lifecycle.

## Install

```sh
npm install @dunky.dev/react-use-focus-trap
```

## Usage

```tsx
import { useRef } from 'react'
import { isTopmostLayer } from '@dunky.dev/dom-overlay'
import { useFocusTrap } from '@dunky.dev/react-use-focus-trap'

function DialogContent({ id }: { id: string }) {
  const panelRef = useRef<HTMLDivElement>(null)
  // `enabled` follows runtime state — here, only the overlay stack's
  // topmost layer traps.
  useFocusTrap(panelRef, { enabled: () => isTopmostLayer(id) })
  return <dialog ref={panelRef}>...</dialog>
}
```

React-specific notes on top of the DOM contract:

- Call it from the component that renders the container, so both mount
  together: the trap binds once, when the target first exists, and releases
  on unmount. A ref that only gains its element on a later render doesn't
  re-arm the trap.
- Options are read through a ref, not the effect's closure: inline
  `enabled` / `last` closures don't re-bind the listener on every render,
  yet each Tab press sees the latest render's values — the per-press
  re-evaluation the DOM contract promises.

## API

### `useFocusTrap(target, options?)`

Returns nothing — the trap lives and dies with the component.

| Param     | Type                             | Default | Description                                                                            |
| --------- | -------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| `target`  | `RefObject<HTMLElement \| null>` | —       | The container to trap Tab / Shift+Tab within.                                          |
| `options` | `UseFocusTrapOptions`            | `{}`    | The DOM trap's options: `enabled?: () => boolean`, `last?: () => HTMLElement \| null`. |
