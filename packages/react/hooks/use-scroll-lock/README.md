# @dunky.dev/react-use-scroll-lock

React binding for [`@dunky.dev/scroll-lock`](../../../shared/utils/scroll-lock):
`useScrollLock(locked)` locks body scrolling while the component is mounted.
The lock behavior itself is framework-free — this hook only owns the React
lifecycle.

## Usage

```tsx
import { useScrollLock } from '@dunky.dev/react-use-scroll-lock'

// Rendered while a modal layer is open, e.g. {open && <ModalPanel />}
function ModalPanel() {
  useScrollLock() // the page behind can't scroll while mounted
  return <div role='dialog'>...</div>
}
```
