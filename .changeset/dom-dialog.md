---
'@dunky.dev/dom-dialog': minor
'@dunky.dev/react-dialog': patch
'@dunky.dev/solid-dialog': patch
---

New package: `@dunky.dev/dom-dialog`, the framework-free DOM half of the
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
const unregister = registerLayer({ id, depth, element: content, modal, backdrop })
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
