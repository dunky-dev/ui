---
'@dunky.dev/solid-dialog': minor
---

New substrate: the Solid binding for `@dunky.dev/dialog`, targeting Solid 2.0
(peers: `solid-js` and `@solidjs/web` at `^2.0.0-rc.0`; 1.x is unsupported —
the binding stands on 2.0's primitives). The same compound anatomy and
behavior contract as the React binding — one core machine, a new host —
delivered in Solid's native shape: the connected api is a fine-grained store,
so a machine transition updates exactly the bindings that changed, and the
core options are plain reactive props (per the controlled contract a
dismissal on a controlled dialog reports nothing — decide it at its source in
the dismissal callbacks, which carry `preventDefault()` for the veto).

```tsx
import { Dialog } from '@dunky.dev/solid-dialog'
;<Dialog open={open()} onOpenChange={setOpen} onEscapeKeyDown={() => setOpen(false)}>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Viewport>
      <Dialog.Content>
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Description>Description</Dialog.Description>
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
```

`Content`'s `initialFocus` accepts an element or an accessor resolved at open
time — the Solid idiom for a ref variable that fills during render, so
`initialFocus={() => cancelButton}` works. Everything else follows the core
spec: layer stack with assistive-tech containment, focus trap with Close as
the cycle's last stop, scroll lock (scoped to the Portal container when
given), exit animations through `data-state="closing"`, and `closeOnBack`.
