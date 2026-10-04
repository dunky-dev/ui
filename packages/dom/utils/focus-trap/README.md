# @dunky.dev/dom-focus-trap

Framework-free Tab/Shift+Tab containment for a DOM subtree. `trapFocus`
attaches one document-level keydown listener and steps focus through the
container's cycle itself: DOM order, wrapping at both ends (including from
the container itself or from focus still outside it), never tabbing out.
Non-rendered elements are excluded, a same-name radio group is one tab stop,
and with no focusables inside, Tab is a no-op.

The `last` option resolves the cycle's final stop wherever it renders — e.g.
a dialog's close button that sits first in the DOM but must not interrupt the
content's order. The trap steps focus itself rather than only guarding the
edges, since a logical order can diverge from DOM order.

Substrate hooks wrap this — e.g. `@dunky.dev/react-use-focus-trap` — so every
framework inherits identical containment behavior.

## Install

```sh
npm install @dunky.dev/dom-focus-trap
```

## Usage

```ts
import { trapFocus } from '@dunky.dev/dom-focus-trap'

const release = trapFocus(container, {
  // Re-evaluated on every Tab press — trapping can follow runtime state,
  // e.g. only the topmost layer of a stack traps.
  enabled: () => isTopmost(container),
})

// later
release()
```
