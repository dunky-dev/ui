# @dunky.dev/react-use-layer-stack

The React half of [`@dunky.dev/dom-layer-stack`](../../../dom/utils/layer-stack):
`useLayerPath()` reads the shared nesting chain for overlay layers — the
enclosing layers' ids, outermost first, empty outside any layer — and
`LayerPathContext` provides it. Every overlay root reads the path, appends its
own layer id, and provides it; the part that mounts while open passes the
value to `registerLayer`, which takes nesting depth from the path's length and
ancestry from its contents.

React context crosses portals, so the path reflects logical nesting where
portaled DOM order inverts it — and one chain shared by every primitive keeps
cross-primitive stacks (a popover inside a dialog) correctly ordered even when
nested layers mount in the same commit.

## Install

```sh
npm install @dunky.dev/react-use-layer-stack
```

## Usage

```tsx
import { useEffect, useMemo } from 'react'
import { registerLayer } from '@dunky.dev/dom-layer-stack'
import { LayerPathContext, useLayerPath } from '@dunky.dev/react-use-layer-stack'

function OverlayRoot({ id, children }) {
  const parentPath = useLayerPath()
  const path = useMemo(() => [...parentPath, id], [parentPath, id])
  return <LayerPathContext.Provider value={path}>{children}</LayerPathContext.Provider>
}

function OverlayContent() {
  const path = useLayerPath()
  useEffect(() => registerLayer({ id, path, element, modal }), [path])
  // ...
}
```
