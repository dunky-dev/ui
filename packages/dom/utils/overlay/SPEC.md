# SPEC / DOM / Overlay

## Overview

The DOM realization of [`@dunky.dev/overlay`](../../../core/utils/overlay/SPEC.md):
one shared module owning what every DOM substrate's overlay — dialog, drawer,
popover, menu, combobox — must agree on. Three concerns live here:

- **The layer stack** — the DOM side of the shared stack, plus assistive-tech
  containment as it shifts.
- **Initial focus** — where focus moves when an overlay opens.
- **The exit window** — the cosmetic tail of an animated close.

Substrate bindings wrap this (e.g. `@dunky.dev/react-dialog`), so overlays
from different substrates on the same page stack, hide, and unwind correctly
against each other.

## Behavior

### Stack and containment

- Every open overlay registers with its element, modality, depth, and — when
  it has one — its backdrop. Topmost follows the core stack's rule.
- While a modal layer is topmost, everything outside its subtree is hidden
  from assistive tech and taken out of pointer and keyboard reach
  (`aria-hidden` + `inert` on the siblings of its ancestor path). The
  layer's own backdrop — rendered outside the content's subtree yet part of
  the layer — stays pressable so an outside press can still dismiss.
- Containment re-syncs on every stack change: a nested layer hides the one
  beneath it, and closing it restores the layer. Restoring puts back exactly
  what was there — an `inert` or a truthy `aria-hidden` the author already
  set stays theirs, untouched in both directions. `aria-hidden="false"`
  asserts visible, the opposite of author-hidden, so such an element is
  hidden like any other and its authored value restored afterwards.
- The backdrop is resolved through a getter, not a snapshot: a re-hide (a
  layer above closing) sees the element current at that moment.

### Initial focus

The strict rule is only that focus moves into the overlay: an overlay that
collects input starts at its first form field (input, select, textarea); any
other content keeps focus on the overlay window itself.

### The exit window

A closing overlay has already left the stack — the page beneath is live
again — but keeps painting until its exit visual finishes:

- `hideExitingLayer` takes the still-painting layer (the content's outermost
  portalled ancestor below the boundary, plus its backdrop) out of
  interaction with `aria-hidden` + `inert`, returning an undo for the reopen
  interrupt. A boundary that isn't an ancestor of the content scopes the
  hide to the content itself — never the document root, which would take the
  whole page out.
- `watchExitAnimation` reports the end of the exit visual once — the
  substrate forwards it to the machine as `exit.complete`. Completion is the
  element's own `transitionend` / `animationend` (bubbled ends from
  descendants don't count), immediate under `prefers-reduced-motion`, or a
  fallback ceiling so a missing exit style can't hang the close.

## API

| Export                                           | Description                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `registerLayer(layer)`                           | Joins the shared stack and syncs containment; returns the disposer that restores it. |
| `Layer`                                          | `OverlayLayer` + `element`, `modal`, and an optional `backdrop` getter.              |
| `isTopmostLayer(id)`                             | Whether the layer owns Escape and the focus trap right now.                          |
| `getInitialFocus(content)`                       | The element to focus on open: first form field, else the overlay window itself.      |
| `hideExitingLayer(content, boundary, backdrop?)` | Inerts the still-painting layer for the exit window; returns the undo.               |
| `watchExitAnimation(element, onComplete)`        | Reports the exit visual's end once; returns the cancel.                              |

## Constraints

- One store for the whole page, even when the module is loaded more than
  once — every copy must rendezvous on the same stack, or their topmost
  decisions drift apart.
- Containment hides one target at a time, and its undo removes exactly what
  it added.
- Content-less tags (`script`, `style`, `link`, `template`) are never
  hidden.

## Internals

| Position                                                                   | Why                                                                                                                                                                                                         |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The store anchors on a realm-global keyed by `Symbol.for`, resolved lazily | A monorepo or micro-frontend can load duplicate copies of this module; separate stores drift apart (the duplicate-singleton bug class of radix-ui/primitives#2815). Lazy keeps `sideEffects: false` honest. |
| Containment re-runs from scratch on every stack change                     | Undo-then-rehide is idempotent and order-free; incremental patching would have to reason about interleaved opens and closes.                                                                                |
| Containment sync guards on `element.isConnected`                           | At teardown the content may already be detached; hiding against a dead node would leak the undo.                                                                                                            |
| Completion is the element's own end event, first one wins                  | A transition ends once per property and descendants bubble theirs; the exit belongs to the element carrying `data-state`, styled to finish as one piece.                                                    |
