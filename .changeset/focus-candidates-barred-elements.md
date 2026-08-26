---
'@dunky.dev/dom-focus-trap': patch
'@dunky.dev/dom-overlay': patch
'@dunky.dev/dom-dialog': patch
---

Focus candidates barred by an ancestor are excluded: controls disabled through
`fieldset[disabled]` and anything inside `[inert]`.

`FOCUSABLE_SELECTOR` and the form-field selector gate on an element's own
attributes (`input:not([disabled])`), but both bars also arrive from
ancestors, so a barred control satisfied the selector while a browser refuses
to focus it — silently.

In the focus trap that was a hard dead end: the Tab keydown is already
`preventDefault()`-ed when focus is stepped by hand, so every press recomputed
the same refused target and focus never moved again. The cycle now only holds
what a browser would actually focus, keeping the native exception that
controls in a disabled fieldset's first `legend` stay enabled.

In the initial-focus chain it was the quieter failure mode: the barred field
won the draw, `focus()` no-opped, and focus fell to the overlay window even
when a viable field came later. Every candidate — designated element and form
fields alike — is now also filtered for these bars.

Both use the new `isFocusable` from `@dunky.dev/dom-element`, beside the
`isRendered` filter they already shared.
