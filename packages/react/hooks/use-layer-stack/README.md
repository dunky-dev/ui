# @dunky.dev/react-use-layer-stack

The React half of [`@dunky.dev/dom-layer-stack`](../../../dom/utils/layer-stack):
`useLayerDepth()` reads the shared nesting-depth scale for overlay layers
(0 = outside any layer), and `LayerDepthContext` provides it. Every overlay
root reads the depth, adds 1, and provides it; the part that mounts while open
passes the value to `registerLayer`.

React context crosses portals, so the depth reflects logical nesting where
portaled DOM order inverts it — and one scale shared by every primitive keeps
cross-primitive stacks (a popover inside a dialog) correctly ordered even when
nested layers mount in the same commit.

## Install

```sh
npm install @dunky.dev/react-use-layer-stack
```

## Usage

```tsx
import { useEffect } from 'react'
import { registerLayer } from '@dunky.dev/dom-layer-stack'
import { LayerDepthContext, useLayerDepth } from '@dunky.dev/react-use-layer-stack'

function OverlayRoot({ children }) {
  const depth = useLayerDepth() + 1
  return <LayerDepthContext.Provider value={depth}>{children}</LayerDepthContext.Provider>
}

function OverlayContent() {
  const depth = useLayerDepth()
  useEffect(() => registerLayer({ id, depth, element, modal }), [depth])
  // ...
}
```
