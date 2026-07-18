---
'@dunky.dev/popover': minor
'@dunky.dev/react-popover': minor
---

Add the Popover primitive — a non-modal floating panel opened from a trigger
that coexists with the page (Escape, an outside press, or focus leaving the
panel dismisses it; `modal` opts into a focus trap instead), shipped as an
agnostic core (`@dunky.dev/popover`) plus a React binding
(`@dunky.dev/react-popover`).

```tsx
import { Popover } from '@dunky.dev/react-popover'

function App() {
  return (
    <Popover onOpenChange={console.log}>
      <Popover.Trigger>Filters</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content>
          <Popover.Title>Filters</Popover.Title>
          <Popover.Description>Narrow down the results.</Popover.Description>
          <Popover.Close>Done</Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  )
}
```

With the `open` prop set the popover is fully controlled: every open/close
intent — trigger press, Escape, outside interaction — is reported through
`onOpenChange`, but the popover only moves when the prop does, so ignoring a
report is a working veto.

There is no positioning engine in v0 — the consumer anchors the panel, and
`data-state` on the trigger and panel is the styling hook.
