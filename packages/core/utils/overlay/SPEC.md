# SPEC / Overlay

## Reference

- **W3C grounding**: [WAI-ARIA 1.2 `aria-modal`](https://www.w3.org/TR/wai-aria-1.2/#aria-modal)
  — the modal window is the only content exposed to the user, which is what
  makes "who is topmost" a question every overlay must answer the same way.
- **Prior art**: the dismissable-layer stacks in Radix and Zag.

## Overview

The agnostic half of overlay coordination. The overlay family — dialog,
drawer, popover, menu, combobox — shares one problem: when overlays stack,
which layer is topmost? The topmost owns Escape, the focus trap, and (when
modal) assistive-tech containment. This package is the registry and the
topmost decision, with no host assumptions — it knows nothing about how a
layer is drawn or how containment is applied. A host realization extends
each layer with a payload — the element or view — and applies its own
containment as the stack shifts;
[`@dunky.dev/dom-overlay`](../../../dom/utils/overlay/SPEC.md) is the DOM
one.

## Behavior

- **Topmost** is the deepest-nested layer — highest `depth` — with open
  order breaking ties at the same depth. Depth, not registration or document
  order, decides: a host may insert a nested layer before its parent (React
  portals do), inverting document order relative to nesting.
- **One stack per host.** A running app is browser or native, never both, so
  each host binding creates a single stack every primitive registers into.
  The shared instance is what makes one Escape close exactly one layer, even
  across different primitives.
- Registering returns a disposer; an empty stack has no topmost.
- A dismissal that reaches past its own layer gets the ones beneath in
  unwinding order — topmost first — so closing a whole stack at once ends up
  where closing it one layer at a time would have.

## API

| Export                  | Description                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| `createLayerStack<T>()` | A fresh stack — one per host binding, not per primitive.                  |
| `OverlayLayer`          | What every layer carries: `id` and `depth` (1 = top-level).               |
| `LayerStack<T>`         | `register(layer)` -> disposer, `topmost()`, `isTopmost(id)`, `below(id)`. |

## Constraints

- Host-free: no DOM, no framework, no timing assumptions.
- The stack tracks and resolves; it never acts — Escape handling, trapping,
  and containment belong to the layers and the host realization.

## Internals

| Position                                                  | Why                                                                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `depth` is carried by the layer, not derived by the stack | Only the primitive knows its nesting; the stack has no host to ask, and document order lies under portals. |
| Topmost is a linear scan, not a maintained order          | Stacks hold a handful of layers; scanning beats keeping an order coherent across out-of-order removals.    |
