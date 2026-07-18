# @dunky.dev/react-popover

React binding for [`@dunky.dev/popover`](../../core/popover): a compound
component — `Popover` plus its parts — that drives the framework-free popover
machine. The root owns the machine; parts translate the core's logical
bindings into DOM attributes and handlers, and wire the DOM-only concerns
(portal, outside-interaction detection, layer stack, focus trap when modal).

Behavior contract: [`../../core/popover/SPEC.md`](../../core/popover/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-popover
```

## Usage

```tsx
import { Popover } from '@dunky.dev/react-popover'

function Filters() {
  return (
    <Popover>
      <Popover.Trigger>Filters</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content>
          <Popover.Title>Filters</Popover.Title>
          <Popover.Description>Narrow down the results.</Popover.Description>
          <input name='owner' type='text' />
          <Popover.Close>Done</Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  )
}
```

There is no positioning engine — the consumer anchors the panel (e.g. portal
into a `position: relative` wrapper and position the content absolutely).
