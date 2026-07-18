# @dunky.dev/react-switch

React binding for [`@dunky.dev/switch`](../../core/switch): a compound
component — `Switch` plus its parts — that drives the framework-free switch
machine. The root owns the machine; parts translate the core's logical
bindings into DOM attributes and handlers.

Behavior contract: [`../../core/switch/SPEC.md`](../../core/switch/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-switch
```

## Usage

```tsx
import { Switch } from '@dunky.dev/react-switch'

function AirplaneMode() {
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
