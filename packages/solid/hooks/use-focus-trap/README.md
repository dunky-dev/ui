# @dunky.dev/solid-use-focus-trap

Solid binding for [`@dunky.dev/dom-focus-trap`](../../../dom/utils/focus-trap):
`useFocusTrap(target)` traps Tab / Shift+Tab within the accessed container
while the owner lives. The trap behavior itself is framework-free — this
primitive only owns the Solid lifecycle.

## Install

```sh
npm install @dunky.dev/solid-use-focus-trap
```

## Usage

```tsx
import { useFocusTrap } from '@dunky.dev/solid-use-focus-trap'

function Dialog() {
  let panel: HTMLDivElement | undefined
  useFocusTrap(() => panel ?? null, { enabled: () => isTopmost(panel) })
  return (
    <div ref={panel} role='dialog'>
      ...
    </div>
  )
}
```
