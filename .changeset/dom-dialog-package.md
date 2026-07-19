---
'@dunky.dev/dom-dialog': minor
'@dunky.dev/react-dialog': patch
---

Add `@dunky.dev/dom-dialog` — the dialog's framework-free DOM behavior,
extracted from the React binding: the shared layer stack (`registerDialog` /
`isTopmostDialog`) with its assistive-tech containment, and `getInitialFocus`.
These were React-free already but lived inside `@dunky.dev/react-dialog`, so
any other substrate would have had to copy them — forking behavior that must
stay identical everywhere. One module is also one stack: dialogs from
different substrates on the same page now stack, hide, and unwind correctly
against each other. `@dunky.dev/react-dialog` consumes it; its public API and
behavior are unchanged.

```ts
import { getInitialFocus, isTopmostDialog, registerDialog } from '@dunky.dev/dom-dialog'

// On open: join the stack, then move focus in.
const unregister = registerDialog({
  id,
  depth, // nesting level, 1 = top-level
  element: content, // the dialog window
  modal: true,
  backdrop: () => backdropElement, // the layer's own backdrop stays pressable
})
getInitialFocus(content).focus({ preventScroll: true })
```
