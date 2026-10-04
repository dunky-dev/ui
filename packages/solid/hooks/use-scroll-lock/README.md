# @dunky.dev/solid-use-scroll-lock

Solid binding for [`@dunky.dev/dom-scroll-lock`](../../../dom/utils/scroll-lock):
`useScrollLock(locked, target?)` locks scrolling while the owner lives — on
the page body, or on the `target` element when one is given (e.g. a scoped
surface locks its own container, not the page). The lock behavior itself is
framework-free — this primitive only owns the Solid lifecycle.

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
