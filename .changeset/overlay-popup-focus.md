---
'@dunky.dev/dom-overlay': minor
---

Two queries tell a layer when a popup it cannot see owns the keyboard:
`foreignPopupHoldsFocus(id)` and `expandedPopupControlHoldsFocus(id)`.

A popup can hold focus inside a layer without ever registering in the stack —
a third-party listbox or menu, a combobox's list. The stack still names the
layer topmost, so the layer would keep answering Escape and trapping Tab under
the popup. The queries read the real owner from ARIA instead: focus in an
element with a popup role (`aria-haspopup`'s values) that is neither the
layer's window nor a registered layer, or on a control inside the window whose
popup is expanded (`aria-expanded` with `aria-haspopup`). No cooperation from
the popup is required.

```ts
enabled: () => isTopmostLayer(id) && !foreignPopupHoldsFocus(id)
```
