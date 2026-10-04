# SPEC / Solid / useScrollLock

The Solid binding of the
[DOM scroll-lock spec](../../../dom/utils/scroll-lock/SPEC.md) — the lock
behavior is framework-free; this primitive owns only the Solid lifecycle.

## Install

```sh
npm install @dunky.dev/solid-use-scroll-lock
```

## Usage

```tsx
import { useScrollLock } from '@dunky.dev/solid-use-scroll-lock'

// Rendered while a modal layer is open, e.g. <Show when={open()}><ModalPanel /></Show>
function ModalPanel() {
  useScrollLock() // the page behind can't scroll while mounted
  return <div role='dialog'>...</div>
}
```

Solid-specific notes on top of the DOM contract:

- The lock holds while the owner lives and `locked` resolves true; disposal
  or turning `locked` off releases it. Both parameters accept a
  `MaybeAccessor` — a static value or an accessor — so the lock tracks
  reactive state: a `target` change releases the old container and locks
  the new one.
- An omitted `target` means the page body; `null` means "no target yet"
  and locks nothing. A plain `ref` read is not reactive — pass a
  signal-backed element so the lock engages once the node resolves.
- The DOM contract's shared per-container lock does the multi-holder
  arithmetic: several live lockers (nested modal layers) hold one lock,
  and the container restores when the last releases.

## API

### `useScrollLock(locked?, target?)`

Returns nothing — the lock lives and dies with the owner.

| Param    | Type                                              | Default       | Description                                                                                                       |
| -------- | ------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `locked` | `MaybeAccessor<boolean>`                          | `true`        | Whether the lock is held.                                                                                         |
| `target` | `MaybeAccessor<HTMLElement \| null \| undefined>` | the page body | The scroll container to lock (e.g. a scoped surface locks its own container, not the page). `null` locks nothing. |
