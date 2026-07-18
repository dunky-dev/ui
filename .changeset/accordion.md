---
'@dunky.dev/accordion': minor
'@dunky.dev/react-accordion': minor
---

Add the Accordion primitive — stacked disclosure sections following the
WAI-ARIA APG pattern, shipped as an agnostic core (`@dunky.dev/accordion`)
plus a React binding (`@dunky.dev/react-accordion`).

The `type` discriminant picks the value shape (`single` speaks
`string | null`, `multiple` speaks `string[]`), so an impossible state — two
open items in single mode — is unrepresentable. Single mode is
non-collapsible by default, per the APG single-expansion pattern; opt into
`collapsible` to allow closing the open item. Arrow keys (orientation-aware),
Home, and End move focus across enabled triggers with wrap.

A controlled `value` is authoritative (the Radix semantics): a press reports
the value it asked for through `onValueChange` and the accordion follows the
prop, so an update the consumer declines never drifts the UI away from the
prop. Per APG, the open item's trigger in single non-collapsible mode is
exposed as `aria-disabled` — its panel cannot be collapsed — while staying
focusable and reachable by keyboard navigation.

```tsx
import { Accordion } from '@dunky.dev/react-accordion'

function App() {
  return (
    <Accordion type='single' collapsible onValueChange={console.log}>
      <Accordion.Item value='shipping'>
        <Accordion.Header>
          <Accordion.Trigger>Shipping</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Ships in 3-5 business days.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value='returns'>
        <Accordion.Header>
          <Accordion.Trigger>Returns</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Free returns within 30 days.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )
}
```
