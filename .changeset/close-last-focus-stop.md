---
'@dunky.dev/dom-focus-trap': minor
'@dunky.dev/dialog': patch
'@dunky.dev/react-dialog': patch
---

The dialog's Close part is now always the focus cycle's last stop, wherever
it renders — a visually-first close button no longer interrupts the
content's tab order.

Mechanism: `@dunky.dev/dom-focus-trap` honors a new `data-focus-last`
attribute (exported as `FOCUS_LAST_ATTRIBUTE`), sorting marked elements to
the end of the cycle, and now steps focus through the cycle itself on every
Tab instead of only guarding the edges — a logical order can diverge from
DOM order, so native tabbing can't be trusted mid-cycle. The dialog's core
connect marks the Close part; any substrate with the trap inherits the
behavior.
