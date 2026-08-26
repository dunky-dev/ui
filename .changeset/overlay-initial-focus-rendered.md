---
'@dunky.dev/dom-overlay': patch
'@dunky.dev/dom-dialog': patch
---

Initial focus now skips a candidate that didn't render.

`getInitialFocus` filtered `[disabled]` and `[type="hidden"]` but never asked
whether the element actually rendered. A field inside a collapsed section
satisfied the selector and won the draw; `focus()` on it did nothing — and said
nothing — so focus fell back to the dialog window, with the fallback's warning
unable to fire, because from its point of view the fallback had succeeded. The
overlay opened on its window instead of the field: degraded, not broken, and
silent.

A designated `initialFocus` that hadn't rendered was worse. It went straight to
the window and skipped the form-field step entirely, contradicting the
documented "when one is set **and can take focus**". So `getInitialFocus` now
takes the designated element as a second argument and resolves the whole chain
in one call, filtering every step rather than just the last:

```ts
// designated -> first form field -> the overlay window itself
getInitialFocus(content, designatedElement).focus({ preventScroll: true })
```

Callers that were writing `initialFocus ?? getInitialFocus(content)` should
pass the designated element in instead — the `??` is what spent it on a
candidate that couldn't take focus. `@dunky.dev/dom-dialog` does this for every
DOM substrate already, so a dialog's `initialFocus` inherits the fix without a
change on the consumer's side.

The predicate is `isRendered` from `@dunky.dev/dom-element`, shared with the
focus trap so the two can't disagree on what counts as rendered.
