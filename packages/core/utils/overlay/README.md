# @dunky.dev/overlay

The agnostic half of overlay coordination: a stack of open overlay layers and
the rule for which one is **topmost**. The topmost layer is the one that owns
Escape, the focus trap, and — when modal — assistive-tech containment, so every
overlay primitive (dialog, drawer, popover, menu, combobox) must agree on it.

This package is host-free — no DOM, no framework. It knows nothing about how a
layer is drawn or how containment is applied; it only tracks the layers and
resolves the topmost. A host binding extends it with a payload (a DOM element, a
native view) and its own containment: `@dunky.dev/dom-overlay` is the DOM one.

- **Topmost** is the deepest-nested layer — highest `depth` — with open order
  breaking ties between layers at the same depth. Depth, not registration or
  document order, decides it: a host may insert a nested layer before its
  parent (React portals do), inverting document order relative to nesting.
- **One stack per host.** A running app is browser or native, never both, so
  each host binding creates a single stack every primitive registers into. That
  shared instance is what makes one Escape close exactly one layer, even across
  different primitives.

## Install

```sh
npm install @dunky.dev/overlay
```

## Usage

```ts
import { createLayerStack, type OverlayLayer } from '@dunky.dev/overlay'

// A host binding extends OverlayLayer with whatever it needs to draw/contain.
interface DomLayer extends OverlayLayer {
  element: HTMLElement
  modal: boolean
}

const stack = createLayerStack<DomLayer>()

// On open: join the stack.
const unregister = stack.register({ id, depth, element, modal: true })

// Escape, outside-press, focus trapping: only the topmost layer answers.
if (stack.isTopmost(id)) {
  // ...
}

// On close: leave the stack.
unregister()
```
