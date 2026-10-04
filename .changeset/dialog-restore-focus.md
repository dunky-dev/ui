---
'@dunky.dev/dom-dialog': minor
'@dunky.dev/react-dialog': minor
'@dunky.dev/solid-dialog': minor
---

`Dialog.Content` gains `restoreFocus` — the close-side counterpart to
`initialFocus`. Closing still returns focus to whatever held it before the
dialog opened; `restoreFocus` names where it goes when that holder can't
meaningfully take focus back: focus sat on the body (a pointer press can
leave it there), or on an element removed from the document since.
Typically the dialog's trigger.

```tsx
// React — a ref, read at close time
<Dialog.Content restoreFocus={triggerRef}>…</Dialog.Content>

// Solid — an element or accessor, resolved at close time
<Dialog.Content restoreFocus={() => trigger}>…</Dialog.Content>
```

Before, those two cases silently dropped focus: restoring to the body goes
nowhere, and focusing a disconnected element is a no-op, leaving focus
stranded on the closing layer. The element focused before opening still
always wins when it is meaningful — the fallback never overrides it. At the
DOM layer, `openDialogLayer` takes `restoreFocus?: () => HTMLElement | null`,
resolved at close.
