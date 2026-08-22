# @dunky.dev/solid-dialog

## 0.1.0

### Minor Changes

- [#44](https://github.com/dunky-dev/ui/pull/44) [`4480950`](https://github.com/dunky-dev/ui/commit/4480950cd629beb214c36da0db4f0eab3e9e1341) Thanks [@ivanbanov](https://github.com/ivanbanov)! - New substrate: the Solid binding for `@dunky.dev/dialog`, targeting Solid 2.0
  (peers: `solid-js` and `@solidjs/web` at `^2.0.0-rc.1`; 1.x is unsupported —
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

### Patch Changes

- [#44](https://github.com/dunky-dev/ui/pull/44) [`e3a5e96`](https://github.com/dunky-dev/ui/commit/e3a5e96b13499b3a0b1dc49d6ec195f67b2d0071) Thanks [@ivanbanov](https://github.com/ivanbanov)! - New package: `@dunky.dev/dom-dialog`, the framework-free DOM half of the
  Dialog. The React and Solid bindings had grown two copies of the same
  document-level code — the Escape listener, the ordered focus/stack sequence
  around the open edge, the exit window, the session-history guard, the
  outside-press gating — differing only in which lifecycle scheduled them. That
  duplication is the drift risk the architecture exists to remove, and it would
  have been copied a third time for Vue.

  Both bindings now contribute only their host's lifecycle:

  ```ts
  // before — the same twenty lines in every DOM substrate
  const previous = document.activeElement
  const unregister = registerLayer({
    id,
    depth,
    element: content,
    modal,
    backdrop,
  })
  const target = initialFocus ?? getInitialFocus(content)
  target.focus({ preventScroll: true })
  // ...

  // after
  return openDialogLayer(content, { id, depth, modal, backdrop, initialFocus })
  ```

  The ordering that made those sequences correct — the stack joins before focus
  moves in, and releases the layers beneath before focus moves back out — is now
  stated and tested in one place rather than re-derived per substrate.

  No consumer-visible behavior changes in either binding; this is an internal
  extraction. `@dunky.dev/dom-dialog` is published because the bindings depend on
  it at runtime, and a substrate outside this repo can build on it directly.

  This also establishes `packages/dom/components/` as a layer: a DOM package
  scoped to one primitive, which may import that primitive's core package and any
  DOM util, but never a framework. `pnpm scaffold <name>` stamps one for every new
  primitive.

- Updated dependencies [[`e3a5e96`](https://github.com/dunky-dev/ui/commit/e3a5e96b13499b3a0b1dc49d6ec195f67b2d0071), [`4480950`](https://github.com/dunky-dev/ui/commit/4480950cd629beb214c36da0db4f0eab3e9e1341), [`e3a5e96`](https://github.com/dunky-dev/ui/commit/e3a5e96b13499b3a0b1dc49d6ec195f67b2d0071)]:
  - @dunky.dev/dom-dialog@0.1.0
  - @dunky.dev/solid-use-focus-trap@0.1.0
  - @dunky.dev/solid-use-scroll-lock@0.1.0
  - @dunky.dev/dialog@0.3.1
