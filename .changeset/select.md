---
'@dunky.dev/select': minor
'@dunky.dev/react-select': minor
---

Add the Select primitive — a single-choice dropdown listbox following the
WAI-ARIA select-only combobox pattern, shipped as an agnostic core
(`@dunky.dev/select`) plus a React binding (`@dunky.dev/react-select`).

DOM focus stays on the trigger the whole time (`aria-activedescendant` tracks
the highlighted option), items register themselves from the render tree, and
the machine owns navigation, typeahead, and selection. Value and open state
are each controlled or uncontrolled; every value, open, and highlight change
is reported through `onValueChange` / `onOpenChange` / `onHighlightChange`.

```tsx
import { Select } from '@dunky.dev/react-select'

function App() {
  return (
    <Select onValueChange={console.log}>
      <Select.Trigger>
        <Select.Value placeholder='Pick a fruit' />
      </Select.Trigger>
      <Select.Listbox>
        <Select.Item value='apple'>
          Apple <Select.ItemIndicator>✓</Select.ItemIndicator>
        </Select.Item>
        <Select.Item value='banana'>
          Banana <Select.ItemIndicator>✓</Select.ItemIndicator>
        </Select.Item>
      </Select.Listbox>
    </Select>
  )
}
```
