---
'@dunky.dev/switch': minor
'@dunky.dev/react-switch': minor
---

Add the Switch primitive — a binary on/off control following the WAI-ARIA APG
pattern, shipped as an agnostic core (`@dunky.dev/switch`) plus a React binding
(`@dunky.dev/react-switch`).

```tsx
import { Switch } from '@dunky.dev/react-switch'

function App() {
  return (
    <Switch onCheckedChange={console.log}>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Switch.Label>Airplane mode</Switch.Label>
    </Switch>
  )
}
```
