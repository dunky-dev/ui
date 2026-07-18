# @dunky.dev/react-tooltip

React binding for [`@dunky.dev/tooltip`](../../core/tooltip): a compound
component — `Tooltip` plus its parts — that drives the framework-free tooltip
machine. The root owns the machine; parts translate the core's logical
bindings into DOM attributes and handlers, and wire the DOM-only concerns
(portal, document-level Escape).

Behavior contract: [`../../core/tooltip/SPEC.md`](../../core/tooltip/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-tooltip
```

## Usage

```tsx
import { Tooltip } from '@dunky.dev/react-tooltip'

function SaveButton() {
  return (
    <Tooltip>
      <Tooltip.Trigger>Save</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content>Save the board (⌘S)</Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip>
  )
}
```
