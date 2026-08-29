---
'@dunky.dev/dom-dialog': minor
'@dunky.dev/react-dialog': patch
'@dunky.dev/solid-dialog': patch
---

`acceptsBackdropPress` / `acceptsViewportPress` are replaced by
`gateBackdropPress(id, bindings)` / `gateViewportPress(id, bindings)`. The
predicates left every DOM substrate writing the same `onClick` wrapper around
them by hand — destructure the press out of the part's normalized bindings,
re-wrap it behind the check — which is exactly the kind of shared DOM behavior
this package exists to hold. The gate now takes the normalized bindings and
returns them with the press gated; a substrate just passes the result to its
`mergeProps`:

```tsx
<div {...mergeProps(props, gateBackdropPress(machine.context.id, normalize(api.parts.backdrop)))} />
```

The gating rules are unchanged: only the topmost dialog of a stack answers an
outside press, and a viewport press must have started on the viewport itself
rather than bubbled up from the content. React and Solid dialogs use the gates
internally — no consumer-facing change there.
