---
'@dunky.dev/dom-scroll-lock': minor
'@dunky.dev/react-use-scroll-lock': minor
---

Add scroll-lock — a reference-counted scroll lock for any container (the page
body by default), so overlapping holders release in any order, compensating
both vanished scrollbars with logical padding. Ships as the framework-free
`@dunky.dev/dom-scroll-lock` (`lockScroll(target?)`) and its React binding
`@dunky.dev/react-use-scroll-lock` (`useScrollLock(locked, target?)`), which
locks while the component is mounted; pass a `target` to scope the lock to a
container instead of the page.

```tsx
import { useScrollLock } from '@dunky.dev/react-use-scroll-lock'

// Rendered only while the overlay is open, e.g. {open && <ModalPanel />}
function ModalPanel({ panelRef }: { panelRef?: React.RefObject<HTMLElement> }) {
  useScrollLock() // locks the page while mounted
  // useScrollLock(true, panelRef?.current) // ...or scope it to a container
  return <div role='dialog'>...</div>
}
```

```ts
// Framework-free: returns a release; the last holder restores the target.
import { lockScroll } from '@dunky.dev/dom-scroll-lock'

const releaseBody = lockScroll() // the page body
const releasePanel = lockScroll(panel) // any scroll container
releaseBody()
releasePanel()
```
