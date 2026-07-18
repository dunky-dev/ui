---
'@dunky.dev/tooltip': minor
'@dunky.dev/react-tooltip': minor
---

Add the Tooltip primitive — a hover/focus description popup following the
WAI-ARIA APG pattern, shipped as an agnostic core (`@dunky.dev/tooltip`) plus
a React binding (`@dunky.dev/react-tooltip`).

Hover opens after `openDelay` (700 ms) and closes after `closeDelay` (300 ms) —
re-entering the trigger or the content while closing keeps it open. Keyboard
focus opens immediately; blur, Escape, and pressing the trigger — by pointer
or by keyboard activation (Enter/Space) — close immediately. Every part
carries `data-state` (`closed`/`opening`/`open`/`closing`) as the styling and
animation hook. Positioning stays with the consumer in v0.

```tsx
import { Tooltip } from '@dunky.dev/react-tooltip'

function App() {
  return (
    <Tooltip openDelay={500} onOpenChange={console.log}>
      <Tooltip.Trigger>Save</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content>Save the board (⌘S)</Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip>
  )
}
```
