---
'@dunky.dev/tabs': minor
'@dunky.dev/react-tabs': minor
---

Add the Tabs primitive — a tabbed interface following the WAI-ARIA APG
pattern, shipped as an agnostic core (`@dunky.dev/tabs`) plus a React binding
(`@dunky.dev/react-tabs`). Controlled/uncontrolled selection, roving tabindex,
arrow-key navigation with wrap and disabled-tab skipping, horizontal/vertical
orientation, and automatic or manual activation.

```tsx
import { Tabs } from '@dunky.dev/react-tabs'

function App() {
  return (
    <Tabs defaultValue='account' onValueChange={console.log}>
      <Tabs.List aria-label='Settings'>
        <Tabs.Trigger value='account'>Account</Tabs.Trigger>
        <Tabs.Trigger value='security'>Security</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value='account'>Account settings</Tabs.Content>
      <Tabs.Content value='security'>Security settings</Tabs.Content>
    </Tabs>
  )
}
```
