---
'@dunky.dev/checkbox': minor
'@dunky.dev/react-checkbox': minor
---

Add the Checkbox primitive — a tri-state checkbox following the WAI-ARIA APG
pattern, shipped as an agnostic core (`@dunky.dev/checkbox`) plus a React
binding (`@dunky.dev/react-checkbox`). `checked` / `defaultChecked` accept
`boolean | 'indeterminate'`, so a bulk-selection parent is driven by a single
controlled value; a press on the control or the label toggles (indeterminate
resolves to checked), and `disabled` blocks the user without blocking
programmatic updates. Value changes report through `onCheckedChange`, but
re-syncing the controlled `checked` prop is never echoed back — a select-all
parent whose value derives from its group can't feed itself its own writes.

```tsx
import { Checkbox } from '@dunky.dev/react-checkbox'

function App() {
  return (
    <Checkbox onCheckedChange={console.log}>
      <Checkbox.Control>
        <Checkbox.Indicator>✓</Checkbox.Indicator>
      </Checkbox.Control>
      <Checkbox.Label>Accept terms and conditions</Checkbox.Label>
    </Checkbox>
  )
}
```
