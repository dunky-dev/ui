---
'@dunky.dev/dom-focus-trap': minor
'@dunky.dev/react-use-focus-trap': minor
---

Add focus-trap — Tab / Shift+Tab containment for a subtree: focus wraps at both
ends and never tabs out; Tab is a no-op with no focusables. Ships as the
framework-free `@dunky.dev/dom-focus-trap` (`trapFocus(container, { enabled })`)
and its React binding `@dunky.dev/react-use-focus-trap`
(`useFocusTrap(ref, { enabled })`), which traps while the component is mounted.

```tsx
import { useRef } from 'react'
import { useFocusTrap } from '@dunky.dev/react-use-focus-trap'

function Panel() {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref) // Tab cycles inside the panel while it is mounted

  return (
    <div ref={ref} tabIndex={-1} role='dialog'>
      <button type='button'>First</button>
      <button type='button'>Last</button>
    </div>
  )
}
```

```ts
// Framework-free: returns a release function; `enabled` is re-checked per Tab.
import { trapFocus } from '@dunky.dev/dom-focus-trap'

const release = trapFocus(panel, { enabled: () => isTopmost(panel) })
release()
```
