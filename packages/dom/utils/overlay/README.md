# @dunky.dev/dom-overlay

Framework-free DOM behavior for overlay substrates — the DOM realization of
`@dunky.dev/overlay`. One shared module owns what every substrate's overlay
(dialog, drawer, alert-dialog, popover, menu, combobox) must agree on:

- **The layer stack** — the DOM side of the shared stack in `@dunky.dev/overlay`.
  Every open overlay joins the stack; the topmost (deepest nesting, open order
  breaking ties) is the one Escape and the focus trap act on. While a modal
  layer is topmost, everything outside it is hidden from assistive tech and
  taken out of pointer and keyboard reach — except the layer's own backdrop,
  which stays pressable so an outside press can still dismiss. Closing a layer
  restores exactly what it hid and hands the page to the layer beneath.
- **Initial focus** — where focus moves when an overlay opens: an overlay that
  collects input starts at its first form field; any other content keeps focus
  on the overlay window itself.
- **The exit window** — an animated overlay leaves the stack the moment it
  starts closing, but keeps painting until its exit visual finishes. For that
  window the still-painting layer is taken out of interaction, and the end of
  the visual is reported so the overlay can unmount — with a fallback ceiling
  so a missing exit style can't hang the close, and skipped entirely under
  reduced motion.

Substrate bindings wrap this — e.g. `@dunky.dev/react-dialog` — so every
framework shares one stack: overlays from different substrates on the same
page stack, hide, and unwind correctly against each other.

## Install

```sh
npm install @dunky.dev/dom-overlay
```

## Usage

```ts
import { getInitialFocus, isTopmostLayer, registerLayer } from '@dunky.dev/dom-overlay'

// On open: join the stack, then move focus in.
const unregister = registerLayer({
  id,
  depth, // nesting level, 1 = top-level
  element: content, // the overlay window
  modal: true,
  backdrop: () => backdropElement, // stays pressable while topmost
})
getInitialFocus(content).focus({ preventScroll: true })

// Escape, outside-press, focus trapping: only the topmost layer answers.
if (isTopmostLayer(id)) {
  // ...
}

// On close: leave the stack; the layer beneath is restored.
unregister()
```
