---
'@dunky.dev/dom-layer-stack': minor
'@dunky.dev/react-use-layer-stack': minor
'@dunky.dev/dom-interact-outside': minor
'@dunky.dev/react-use-interact-outside': minor
'@dunky.dev/react-dialog': patch
---

Add the shared overlay utilities the whole overlay family (dialog, drawer,
alert-dialog, popover, menu, combobox) builds on, extracted from the dialog's
internals so stacked overlays from different primitives coordinate instead of
fighting.

- `@dunky.dev/dom-layer-stack` — one shared registry of open overlay layers.
  `registerLayer({ id, depth, element, modal })` returns an unregister
  disposer; `isTopmostLayer(id)` answers which layer owns Escape, the focus
  trap, and outside presses (deepest layer wins, open order breaks ties);
  `layerContainsTarget(id, target)` tells outside-press detection that a node
  in a nested (deeper) layer is not outside — an independent sibling at the
  same depth still is. Registering also keeps assistive-tech containment in
  sync: everything outside the topmost modal layer — and the layers stacked
  above it — gets `aria-hidden` + `inert`, with an exact undo. The single
  instance is the point: with one registry, one Escape press closes exactly
  one layer even when a menu stacks over a dialog.
- `@dunky.dev/react-use-layer-stack` — the React half: `useLayerDepth()`
  reads the shared nesting-depth scale (0 = outside any layer) and
  `LayerDepthContext` provides it — every overlay root reads the depth, adds
  1, and provides. React context crosses portals, so the depth reflects
  logical nesting where portaled DOM order inverts it.
- `@dunky.dev/dom-interact-outside` — document-level outside-interaction
  detection for non-modal overlays with no backdrop to catch presses.
  `trackInteractOutside(container, { onInteractOutside, ignore })` fires on
  capture-phase `pointerdown` / `focusin` outside the container; a press that
  also moves focus outside reports once, not twice; dismissal stays the
  caller's decision.
- `@dunky.dev/react-use-interact-outside` — its React lifecycle:
  `useInteractOutside(ref, options)` binds while mounted and reads the handler
  and `ignore` predicate through refs, so inline closures never re-bind the
  document listeners.

```ts
import { isTopmostLayer, layerContainsTarget, registerLayer } from '@dunky.dev/dom-layer-stack'
import { useInteractOutside } from '@dunky.dev/react-use-interact-outside'
import { useLayerDepth } from '@dunky.dev/react-use-layer-stack'

const depth = useLayerDepth()
const unregister = registerLayer({ id, depth, element: panel, modal: false })
useInteractOutside(panelRef, {
  onInteractOutside: event => dismiss(event),
  ignore: target => layerContainsTarget(id, target) || anchor.contains(target),
})
```

`@dunky.dev/react-dialog` now consumes the shared layer stack instead of its
private one — same behavior, one refinement: a non-modal layer opening above a
modal dialog no longer drops the page's assistive-tech containment; the
containment anchors on the topmost modal layer and keeps the layers above it
reachable, which is what lets a popover or menu live inside a dialog.
