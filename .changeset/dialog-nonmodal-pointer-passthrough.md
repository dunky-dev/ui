---
'@dunky.dev/dom-dialog': minor
'@dunky.dev/react-dialog': patch
'@dunky.dev/solid-dialog': patch
---

A non-modal dialog no longer blocks the page around it. `Dialog.Viewport` is
a full-coverage layer, so even with no backdrop rendered it swallowed every
press aimed at the page beneath — the page element never received it, and
the dialog dismissed instead. Now, while `modal={false}`, the Viewport
renders with `pointer-events: none` and the window with
`pointer-events: auto` (the consumer's own `style` wins over both), so
presses on the empty area reach the page and the window stays interactive.

Outside-press detection moves with it: a transparent Viewport never receives
the press it used to detect, so `@dunky.dev/dom-dialog` gains
`watchOutsidePress` — a document-level watch (the only vantage point that
sees both the portaled dialog and the page) with the same refusals as the
element path: topmost dialog only, the window excepted, and the trigger
excepted so its own press stays a plain toggle instead of a
close-and-reopen. `viewportPointerEvents(modal)` and `contentPointerEvents`
carry the two style values so every DOM substrate applies the same pair.
