# SPEC / DOM / Focus trap

## Reference

- **W3C pattern**: the [APG modal-dialog keyboard interaction](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboardinteraction)
  Tab/Shift+Tab contract — this package is its DOM mechanics; the policy
  (when a trap applies, who traps in a stack, where focus lands on open)
  stays with the caller. The trap still intercepts a Tab pressed before the
  caller has moved focus in.
- **W3C pattern**: the [APG radio group keyboard interaction](https://www.w3.org/WAI/ARIA/apg/patterns/radio/#keyboardinteraction)
  — a same-name radio group is a single tab stop, which the trap reproduces
  because it steps focus itself.

## Overview

Framework-free Tab / Shift+Tab containment for a DOM subtree. One
document-level keydown listener steps focus through the container's cycle
itself — it does not merely guard the edges — so a logical order can diverge
from DOM order (a dialog's Close rendered first but cycling last) without
native tabbing breaking the cycle mid-way, and a Tab pressed while focus is
still outside the container re-enters the cycle at the edge. Substrate hooks
wrap it (e.g. `@dunky.dev/react-use-focus-trap`) so every framework inherits
identical containment.

## Behavior

- Every Tab press moves focus one step through the container's focusables in
  DOM order, wrapping at both ends; Shift+Tab steps backward. Focus never
  tabs out.
- `last` resolves the cycle's final stop: the element is sorted after
  everything else, wherever it renders.
- Off-cycle focus — the container itself, a scripted `tabindex="-1"` target,
  or focus anywhere outside the container (e.g. still on the trigger) —
  re-enters the cycle at the edge the direction implies: Tab to the first
  focusable, Shift+Tab to the last.
- With no focusables inside, Tab is a no-op; focus stays where it is.
- `enabled` and `last` are re-evaluated on every press, so trapping follows
  runtime state — e.g. only the topmost layer of a stack traps.
- A focusable is an element matching `FOCUSABLE_SELECTOR` whose `tabIndex`
  is not negative and which is rendered: no `hidden` attribute, no
  `display: none` on itself or an ancestor, no `visibility: hidden`.
  Focusing a non-rendered element is a no-op, so keeping one in the cycle
  would stall the trap on it.
- A same-name radio group is one tab stop — the checked radio, else the
  group's first — per the APG radio group pattern; groups are scoped by
  name and form owner, matching the browser's own grouping.

## API

| Export                           | Description                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `trapFocus(container, options?)` | Attaches the trap; returns a release that removes the listener.                                                  |
| `TrapFocusOptions`               | `enabled?: () => boolean` (default: always) and `last?: () => HTMLElement \| null` (default: DOM order decides). |
| `getFocusables(container)`       | The container's focusables, in DOM order.                                                                        |
| `FOCUSABLE_SELECTOR`             | The focusability selector, exported for callers with their own scanning.                                         |

## Constraints

- While enabled, the trap owns the whole step, not just the wrap: the Tab is
  `preventDefault()`-ed and focus is moved by hand. A disabled trap prevents
  nothing and lets Tab through.
- Initial focus on open is the caller's job; the trap never focuses anything
  until a Tab is pressed.

## Internals

| Position                                                                 | Why                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Focus is stepped manually on every press, not only at the edges          | The `last` re-ordering makes the logical cycle diverge from DOM order, so native tabbing can't be trusted mid-cycle.                                                                                                                                                                                   |
| Document-level, capture-phase keydown listener                           | A container listener misses presses while focus is still outside; capture delivery survives a `stopPropagation` in the subtree.                                                                                                                                                                        |
| Rendered-ness via a computed-style walk, not `Element.checkVisibility()` | The API is recent (Chrome/Edge 105+, Firefox 106+, Safari 17.4+) and the trap resolves focusables after the Tab keydown's `preventDefault()`, so on any browser without it the throw would leave Tab dead entirely; the walk is spec-defined behavior everywhere (and needs no test-environment shim). |
