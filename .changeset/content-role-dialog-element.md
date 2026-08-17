---
'@dunky.dev/react-dialog': minor
---

`Dialog.Content` now renders a `<div>` carrying the `dialog` (or `alertdialog`) role instead of the native `<dialog>` element. Consumers styling `dialog { ... }` should target the part directly (or its role), and a forwarded ref is now an `HTMLDivElement`; `...props` accept `ComponentProps<'div'>`.

The dialog window is the initial focus target — focusable in script, out of the tab order — which needs `tabindex="-1"`, and HTML states that [the `tabindex` attribute must not be specified on `dialog` elements](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element). The native element would only pay off through `showModal()`, and this contract deliberately keeps modality, dismissal, and focus in the core machine rather than splitting authority with the browser's built-in behavior — so the element brought nothing but a conformance violation. Nothing about the exposed semantics changes: the same role, `aria-modal`, name, description, and focus behavior as before. UA `<dialog>` resets (`position: static`, `border: none`) are no longer needed in consumer styles.
