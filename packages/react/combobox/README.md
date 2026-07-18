# @dunky.dev/react-combobox

React binding for [`@dunky.dev/combobox`](../../core/combobox): a compound
component — `Combobox` plus its parts — that drives the framework-free
combobox machine. The root owns the machine; parts translate the core's
logical bindings into DOM attributes and handlers, and wire the DOM-only
concerns (outside-interaction detection, Escape routing, the overlay layer
stack).

Behavior contract: [`../../core/combobox/SPEC.md`](../../core/combobox/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-combobox
```

## Usage

```tsx
import { useState } from 'react'
import { Combobox } from '@dunky.dev/react-combobox'

const fruits = ['Apple', 'Banana', 'Cherry']

function FruitPicker() {
  // Filtering is the consumer's: render the Items that match the input text.
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
