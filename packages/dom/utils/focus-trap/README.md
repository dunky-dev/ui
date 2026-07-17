# @dunky.dev/focus-trap

Framework-free Tab/Shift+Tab containment for a DOM subtree. `trapFocus`
attaches one keydown listener to a container: focus wraps from the last
focusable back to the first (and the reverse with Shift+Tab, including from the
container itself) and never tabs out. With no focusables inside, Tab is a
no-op.

Substrate hooks wrap this — e.g. `@dunky.dev/react-use-focus-trap` — so every
framework inherits identical containment behavior.

## Install

```sh
npm install @dunky.dev/focus-trap
```

## Usage

```ts
import { trapFocus } from '@dunky.dev/focus-trap'

const release = trapFocus(container, {
  // Re-evaluated on every Tab press — trapping can follow runtime state,
  // e.g. only the topmost layer of a stack traps.
  enabled: () => isTopmost(container),
})

// later
release()
```
