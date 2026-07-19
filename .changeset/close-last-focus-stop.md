---
'@dunky.dev/dom-focus-trap': minor
'@dunky.dev/dialog': patch
'@dunky.dev/react-dialog': patch
---

The dialog's Close part is now always the focus cycle's last stop, wherever
it renders — a visually-first close button no longer interrupts the
content's tab order.

Mechanism: `trapFocus` gains a `last` option resolving the cycle's final
stop, and now steps focus through the cycle itself on every Tab instead of
only guarding the edges — a logical order can diverge from DOM order, so
native tabbing can't be trusted mid-cycle. The dialog's core stays
substrate-agnostic: Close joins the derived part ids (`ids.close`), and each
substrate's containment resolves the element by that id.
