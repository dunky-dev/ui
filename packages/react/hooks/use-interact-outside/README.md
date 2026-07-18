# @dunky.dev/react-use-interact-outside

React binding for
[`@dunky.dev/dom-interact-outside`](../../../dom/utils/interact-outside):
`useInteractOutside(ref, options)` fires `onInteractOutside` for presses and
focus landing outside the referenced container while the component is mounted.
The detection itself is framework-free — this hook only owns the React
lifecycle, reading the handler and `ignore` predicate through refs so inline
closures never re-bind the document listeners.

## Install

```sh
npm install @dunky.dev/react-use-interact-outside
```

## Usage

```tsx
import { useRef } from 'react'
import { useInteractOutside } from '@dunky.dev/react-use-interact-outside'

function PopoverPanel() {
  const panelRef = useRef<HTMLDivElement>(null)
  useInteractOutside(panelRef, {
    onInteractOutside: event => dismiss(event),
    // A press in a nested layer or on the anchor never counts as outside.
    ignore: target => layerContainsTarget(id, target) || anchor.contains(target),
  })
  return <div ref={panelRef}>...</div>
}
```
