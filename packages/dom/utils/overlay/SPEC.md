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
- Containment follows the **topmost modal layer**, not the topmost layer.
  Everything outside that layer's subtree is hidden from assistive tech and
  taken out of pointer and keyboard reach (`aria-hidden` + `inert`). Two
  kinds of element are held out of it — together the _retained roots_: the
  layer's own backdrop — rendered outside the content's subtree yet part of
  the layer — so an outside press can still dismiss, and every layer stacked
  above it.
- Hiding descends from the body rather than walking up from the layer, and a
  branch that holds a retained root is descended into rather than spared
  whole. Portalling is the consumer's choice — every overlay exposes
  `container` on its Portal part — so a layer can land on an app branch that
  holds page content beside it; sparing the branch would leave that content
  reachable. A layer at or above the body is a no-op: nothing sits outside
  it.
- A non-modal layer above a modal one does not release the modal layer's
  containment. The ordinary layers — a select menu, a combobox list, a
  tooltip, a context menu — are non-modal, and living inside a dialog is
  their normal habitat; `aria-modal` means the modal window is the only
  content exposed for as long as it is open, so containment cannot lapse
  just because a menu opened on top of it. Such a layer still takes over
  Escape and the focus trap, because it is topmost; it simply leaves
  containment where it is. Since these layers portal to the body — siblings
  of the dialog rather than descendants — holding them out of the
  containment is what keeps them reachable.
- Containment re-syncs on every stack change: a nested layer hides the one
  beneath it, and closing it restores the layer. Restoring puts back exactly
  what was there — an `inert` or a truthy `aria-hidden` the author already
  set stays theirs, untouched in both directions. `aria-hidden="false"`
  asserts visible, the opposite of author-hidden, so such an element is
  hidden like any other and its authored value restored afterwards.
- The backdrop is resolved through a getter, not a snapshot: a re-hide (a
  layer above closing) sees the element current at that moment.

### Popups the stack never sees

A popup can hold focus inside a layer without registering — a listbox or menu
from another library, a combobox's list. The stack still names the layer
topmost, so the layer would keep answering Escape and trapping Tab under the
popup. Two queries read the real owner from ARIA instead, and a layer consults
them to stand down:

- `foreignPopupHoldsFocus(id)` — focus sits in a popup that is neither the
  layer's own window nor a registered layer: an element with a popup role
  (`aria-haspopup`'s values — listbox, menu, tree, grid, dialog), wherever it
  renders, or anything outside the window that is in no popup role at all —
  the page is inert while a modal layer is open, so whatever holds focus out
  there is a layer. Focus on the body doesn't count: the layer re-enters from
  there. Registered layers never count as foreign — a layer beneath is inert,
  and focus reported there re-enters the topmost layer's trap.
- `expandedPopupControlHoldsFocus(id)` — focus sits on a control inside the
  window whose popup is expanded (`aria-expanded="true"` with `aria-haspopup`),
  the way a combobox keeps focus on its input while its list is open.
  `aria-expanded` alone is a disclosure, which has no popup to close.

No cooperation from the popup is required — any well-formed ARIA popup works.
A popup that does register is simply topmost, and the stack answers as usual.

### Initial focus

The strict rule is only that focus moves into the overlay: an overlay that
collects input starts at its first form field (input, select, textarea); any
other content keeps focus on the overlay window itself. A caller may
designate an element ahead of both.

Every candidate must be one a browser would actually focus — rendered, and
not barred by an ancestor `fieldset[disabled]` or `[inert]`, which the
selector's own-attribute checks can't see. A field inside a collapsed
section or a disabled fieldset satisfies the selector, yet `focus()` on it
does nothing and reports nothing, so accepting it would spend the candidate
and drop focus to the overlay window — the fallback firing on a miss it
can't see. Each step of the chain is therefore filtered, not just the last
one; the predicates are [`@dunky.dev/dom-element`](../element/SPEC.md)'s
`isRendered` and `isFocusable`, shared with the focus trap so the two can't
disagree on what counts.

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

| Export                                           | Description                                                                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `registerLayer(layer)`                           | Joins the shared stack and syncs containment; returns the disposer that restores it.                                              |
| `Layer`                                          | `OverlayLayer` + `element`, `modal`, an optional `backdrop` getter, and an optional `dismiss`.                                    |
| `isTopmostLayer(id)`                             | Whether the layer owns Escape and the focus trap right now.                                                                       |
| `layersBelow(id)`                                | The layers stacked beneath, topmost first — the unwinding order for a stack-scoped dismissal.                                     |
| `foreignPopupHoldsFocus(id)`                     | Whether focus sits in a popup that is neither the layer's window nor a registered layer.                                          |
| `expandedPopupControlHoldsFocus(id)`             | Whether focus sits on a control inside the layer's window whose popup is expanded.                                                |
| `getInitialFocus(content, designated?)`          | The element to focus on open: `designated`, else first form field, else the overlay window — each step filtered for renderedness. |
| `hideExitingLayer(content, boundary, backdrop?)` | Inerts the still-painting layer for the exit window; returns the undo.                                                            |
| `watchExitAnimation(element, onComplete)`        | Reports the exit visual's end once; returns the cancel.                                                                           |

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
| Hiding descends from the body instead of walking up from the layer         | A branch can hold page content beside a retained root, and `container` on the Portal parts lets a layer land on one; skipping the branch to spare the layer would leave the content beside it reachable.    |
| Containment sync guards on `element.isConnected`                           | At teardown the content may already be detached; hiding against a dead node would leak the undo.                                                                                                            |
| Completion is the element's own end event, first one wins                  | A transition ends once per property and descendants bubble theirs; the exit belongs to the element carrying `data-state`, styled to finish as one piece.                                                    |
