---
'@dunky.dev/react-use-scroll-lock': patch
'@dunky.dev/solid-use-scroll-lock': patch
---

`useScrollLock` now treats a `null` target as "no target yet" and locks
nothing. Previously `null` collapsed into "the page body", so passing a
not-yet-resolved element (e.g. `ref.current` on the first run) locked the
page instead of the intended container — and never corrected itself. An
omitted target still means the page body.

Pass the element through something reactive so the lock engages once the
node resolves — in React hold it in state (a ref populating doesn't
re-render), in Solid pass a signal-backed element (a plain `ref` read is
not reactive):

```tsx
// React
const [panel, setPanel] = useState<HTMLElement | null>(null)
useScrollLock(open, panel) // locks nothing until the node resolves

// Solid
const [panel, setPanel] = createSignal<HTMLElement | null>(null)
useScrollLock(open, panel)
```
