---
'@dunky.dev/radio': minor
'@dunky.dev/react-radio': minor
---

Add the Radio primitive — a radio group following the WAI-ARIA APG pattern,
shipped as an agnostic core (`@dunky.dev/radio`) plus a React binding
(`@dunky.dev/react-radio`). Controlled and uncontrolled value, roving
tabindex, arrow-key navigation that moves focus and selects (wrapping and
skipping disabled items), Space to check, and per-item label association —
all decided in the core machine, so every substrate inherits the behavior.
Form integration (hidden inputs) is intentionally out of scope for v0.

```tsx
import { Radio } from '@dunky.dev/react-radio'

function App() {
  return (
    <Radio defaultValue='comfortable' onValueChange={console.log}>
      <Radio.Group aria-label='Density'>
        <Radio.Item value='compact'>
          <Radio.ItemIndicator />
        </Radio.Item>
        <Radio.ItemLabel value='compact'>Compact</Radio.ItemLabel>
        <Radio.Item value='comfortable'>
          <Radio.ItemIndicator />
        </Radio.Item>
        <Radio.ItemLabel value='comfortable'>Comfortable</Radio.ItemLabel>
      </Radio.Group>
    </Radio>
  )
}
```
