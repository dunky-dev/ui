---
'@dunky.dev/dom-dialog': patch
---

The dialog warns when it resolves no accessible name. The core contract —
a rendered Title, or an `aria-label` / `aria-labelledby` on Content, never
neither — was documented but unenforced, so a nameless dialog shipped
silently. `openDialogLayer` now checks the window's own attributes on open
and warns with the fix, the same loud treatment the stranded-focus miss
already gets. The check reads the DOM rather than the machine's
Title-presence flag (a label may arrive through a prop spread), defers a
macrotask so a rendered Title's registration commits first, and is cancelled
by the close.
