# SPEC / React / useScrollLock

The React binding of the
[DOM scroll-lock spec](../../../dom/utils/scroll-lock/SPEC.md) — the lock
behavior is framework-free; this hook owns only the React lifecycle.

## Install

```sh
npm install @dunky.dev/react-use-scroll-lock
```

## Usage

```tsx
import { useScrollLock } from '@dunky.dev/react-use-scroll-lock'

// Rendered while a modal layer is open, e.g. {open && <ModalPanel />}
function ModalPanel() {
  useScrollLock() // the page behind can't scroll while mounted
  return <div role='dialog'>...</div>
}
```

React-specific notes on top of the DOM contract:

- The lock holds while the component is mounted and `locked` is true;
  unmounting or turning `locked` off releases it. A `target` change
  releases the old container and locks the new one.
- The DOM contract's shared per-container lock does the multi-holder
  arithmetic: several mounted lockers (nested modal layers) hold one lock,
  and the container restores when the last unmounts.

## API

### `useScrollLock(locked?, target?)`

Returns nothing — the lock lives and dies with the component.

| Param    | Type                  | Default       | Description                                                                                 |
| -------- | --------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `locked` | `boolean`             | `true`        | Whether the lock is held.                                                                   |
| `target` | `HTMLElement \| null` | the page body | The scroll container to lock (e.g. a scoped surface locks its own container, not the page). |
