---
'@dunky.dev/dom-overlay': patch
---

Page content beside a layer portalled into an app branch is now hidden by a
modal layer's containment.

Containment holds a few elements out of the hiding — the topmost modal layer,
its backdrop, and the layers stacked above it — and it matched them by
ancestry, so a branch that _contained_ one was skipped whole. Where a layer
sits is the consumer's choice: `container` on the Portal part lets it land
anywhere, and when that branch also held page content, the entire branch went
unhidden — the page reachable by pointer, keyboard, and screen reader for as
long as the layer was open.

```tsx
// The menu lands inside the app branch, beside the page content.
<Dialog.Portal container={appElement}>
```

Hiding now descends from the body instead of walking up from the layer. A
branch that holds one of those retained elements is descended into rather than
spared, so the content beside it is hidden individually while the layer itself
stays reachable. A layer at or above the body is a no-op — nothing sits
outside it.
