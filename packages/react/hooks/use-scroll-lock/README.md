# @dunky.dev/react-use-scroll-lock

React binding for [`@dunky.dev/dom-scroll-lock`](../../../dom/utils/scroll-lock):
`useScrollLock(locked, target?)` locks scrolling while the component is
mounted — on the page body, or on the `target` element when one is given (e.g.
a scoped surface locks its own container, not the page). The lock behavior
itself is framework-free — this hook only owns the React lifecycle.

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
