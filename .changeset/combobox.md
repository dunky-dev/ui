---
'@dunky.dev/combobox': minor
'@dunky.dev/react-combobox': minor
---

Add the Combobox primitive — an editable combobox with list autocomplete
following the WAI-ARIA APG pattern, shipped as an agnostic core
(`@dunky.dev/combobox`) plus a React binding (`@dunky.dev/react-combobox`).

DOM focus stays in the input the whole time (`aria-activedescendant` tracks
the highlighted suggestion), items register themselves from the render tree,
and the machine owns navigation, highlighting, and selection. Filtering is
the consumer's: render the Items that match the input text — the machine
navigates whatever is rendered, keeping arrow-key order aligned with the
rendered order even as filtering unmounts, remounts, or re-sorts items in
place. Value, input
text, and open state are each controlled or uncontrolled; every change is
reported through `onValueChange` / `onInputValueChange` / `onOpenChange` /
`onHighlightChange`. The open listbox joins the shared overlay layer stack,
so Escape and outside interactions dismiss one layer at a time across
primitives.

```tsx
import { useState } from 'react'
import { Combobox } from '@dunky.dev/react-combobox'

const fruits = ['Apple', 'Banana', 'Cherry']

function App() {
  const [query, setQuery] = useState('')
  const matches = fruits.filter(fruit => fruit.toLowerCase().includes(query.toLowerCase()))
  return (
    <Combobox inputValue={query} onInputValueChange={setQuery} onValueChange={console.log}>
      <Combobox.Input aria-label='Fruit' />
      <Combobox.Trigger aria-label='Show fruits'>▾</Combobox.Trigger>
      <Combobox.Listbox>
        {matches.map(fruit => (
          <Combobox.Item key={fruit} value={fruit.toLowerCase()} label={fruit}>
            {fruit} <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
          </Combobox.Item>
        ))}
      </Combobox.Listbox>
    </Combobox>
  )
}
```
