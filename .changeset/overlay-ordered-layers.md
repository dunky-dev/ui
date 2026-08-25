---
'@dunky.dev/overlay': minor
'@dunky.dev/dom-overlay': patch
---

Assistive-tech containment no longer lapses while a non-modal layer is open
above a modal one.

Containment now follows the topmost **modal** layer rather than the topmost
layer. The ordinary layers — a select menu, a combobox list, a tooltip, a
context menu — are non-modal and live inside dialogs; opening one used to
release the dialog's containment, leaving the page behind reachable by
pointer, keyboard, and screen reader for exactly as long as someone was
interacting with the menu. The layers stacked above the modal one are held
out of the hiding — they portal to the body as siblings of the dialog, so
without the exception the containment would inert the very layer the user is
in. Topmost keeps its meaning: a non-modal layer above still owns Escape and
the focus trap; only containment stays put.

To support this, the agnostic stack gains a public `ordered()` method
returning every layer topmost first — the host needs to look past the top of
the stack, while modality stays a host concept:

```ts
const stack = createLayerStack<Layer>()
stack.ordered() // every layer, topmost first
```
