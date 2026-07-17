# @dunky.dev/react-use-focus-trap

React binding for [`@dunky.dev/focus-trap`](../../../dom/utils/focus-trap):
`useFocusTrap(ref)` traps Tab / Shift+Tab within the referenced container while
the component is mounted. The trap behavior itself is framework-free — this
hook only owns the React lifecycle.

## Usage

```tsx
import { useRef } from 'react'
import { useFocusTrap } from '@dunky.dev/react-use-focus-trap'

function ModalPanel() {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, { enabled: () => isTopmost(panelRef.current) })
  return (
    <div ref={panelRef} tabIndex={-1} role='dialog'>
      ...
    </div>
  )
}
```
