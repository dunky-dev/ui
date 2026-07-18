# @dunky.dev/react-radio

React binding for [`@dunky.dev/radio`](../../core/radio): a compound
component — `Radio` plus its parts — that drives the framework-free radio
group machine. The root owns the machine; parts translate the core's logical
bindings into DOM attributes and handlers, and wire the DOM-only concerns
(item registration, roving DOM focus).

Behavior contract: [`../../core/radio/SPEC.md`](../../core/radio/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-radio
```

## Usage

```tsx
import { Radio } from '@dunky.dev/react-radio'

function Density() {
  return (
    <Radio defaultValue='comfortable'>
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
