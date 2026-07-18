# @dunky.dev/react-checkbox

React binding for [`@dunky.dev/checkbox`](../../core/checkbox): a compound
component — `Checkbox` plus its parts — that drives the framework-free
checkbox machine. The root owns the machine; parts translate the core's
logical bindings into DOM attributes and handlers.

Behavior contract: [`../../core/checkbox/SPEC.md`](../../core/checkbox/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-checkbox
```

## Usage

```tsx
import { Checkbox } from '@dunky.dev/react-checkbox'

function AcceptTerms() {
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
