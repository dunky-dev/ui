# @dunky.dev/react-collapsible

React binding for [`@dunky.dev/collapsible`](../../core/collapsible): a compound
component — `Collapsible` plus its parts — that drives the framework-free
collapsible machine. The root owns the machine; parts translate the core's
logical bindings into DOM attributes and handlers.

Behavior contract: [`../../core/collapsible/SPEC.md`](../../core/collapsible/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-collapsible
```

## Usage

```tsx
import { Collapsible } from '@dunky.dev/react-collapsible'

function ShowMore() {
  return (
    <Collapsible>
      <Collapsible.Trigger>Show more</Collapsible.Trigger>
      <Collapsible.Content>
        The content stays mounted while closed — `data-state` is the styling and animation hook.
      </Collapsible.Content>
    </Collapsible>
  )
}
```
