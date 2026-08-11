# SPEC / DOM / Focus trap

## Reference

- **W3C pattern**: the [APG modal-dialog keyboard interaction](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboardinteraction)
  Tab/Shift+Tab contract — this package is its DOM mechanics; the policy
  (when a trap applies, who traps in a stack) stays with the caller.

## Overview

Framework-free Tab / Shift+Tab containment for a DOM subtree. One keydown
listener on a container steps focus through the cycle itself — it does not
merely guard the edges — so a logical order can diverge from DOM order (a
dialog's Close rendered first but cycling last) without native tabbing
breaking the cycle mid-way. Substrate hooks wrap it (e.g.
`@dunky.dev/react-use-focus-trap`) so every framework inherits identical
containment.

## Behavior

- Every Tab press moves focus one step through the container's focusables in
  DOM order, wrapping at both ends; Shift+Tab steps backward. Focus never
  tabs out.
- `last` resolves the cycle's final stop: the element is sorted after
  everything else, wherever it renders.
- Off-cycle focus — the container itself, or a scripted `tabindex="-1"`
  target — re-enters the cycle at the edge the direction implies: Tab to the
  first focusable, Shift+Tab to the last.
- With no focusables inside, Tab is a no-op; focus stays where it is.
- `enabled` and `last` are re-evaluated on every press, so trapping follows
  runtime state — e.g. only the topmost layer of a stack traps.
- A focusable is an element matching `FOCUSABLE_SELECTOR` whose `tabIndex`
  is not negative.

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
- Focusability is selector-based, not visibility-probed.

## Internals

| Position                                                        | Why                                                                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Focus is stepped manually on every press, not only at the edges | The `last` re-ordering makes the logical cycle diverge from DOM order, so native tabbing can't be trusted mid-cycle. |
| Selector-based focusability, no visibility probing              | `offsetParent` is always `null` in jsdom, and the trapped subtree is visible whenever the trap runs.                 |
