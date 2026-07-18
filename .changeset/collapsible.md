---
'@dunky.dev/collapsible': minor
'@dunky.dev/react-collapsible': minor
---

Add the Collapsible primitive — a disclosure that shows and hides a content
region, following the WAI-ARIA APG pattern, shipped as an agnostic core
(`@dunky.dev/collapsible`) plus a React binding
(`@dunky.dev/react-collapsible`).

```tsx
import { Collapsible } from '@dunky.dev/react-collapsible'

function App() {
  return (
    <Collapsible onOpenChange={console.log}>
      <Collapsible.Trigger>Show more</Collapsible.Trigger>
      <Collapsible.Content>Details...</Collapsible.Content>
    </Collapsible>
  )
}
```

The content stays mounted while closed (hidden, never unmounted), so the
trigger's `aria-controls` never dangles and `data-state` can drive open/close
animations. `disabled` gates user toggling in the machine while the trigger
stays focusable (`aria-disabled`), keeping the state perceivable to keyboard
and screen-reader users; programmatic and controlled open/close stay ungated.

Controlled `open` is follow + report, matching the dialog: the machine follows
the prop when its value changes, and a user toggle between updates still moves
state, reported through `onOpenChange` — feed the reported value back into
`open` to stay in agreement. It is not Radix-style source-of-truth state.
