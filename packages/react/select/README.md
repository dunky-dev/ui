# @dunky.dev/react-select

React binding for [`@dunky.dev/select`](../../core/select): a compound
component — `Select` plus its parts — that drives the framework-free select
machine. The root owns the machine; parts translate the core's logical
bindings into DOM attributes and handlers, and wire the DOM-only concerns
(item registration, outside-press dismissal, controlled-prop sync).

Behavior contract: [`../../core/select/SPEC.md`](../../core/select/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-select
```

## Usage

```tsx
import { Select } from '@dunky.dev/react-select'

function FruitPicker() {
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
        <Select.Item value='cherry' disabled>
          Cherry
        </Select.Item>
      </Select.Listbox>
    </Select>
  )
}
```
