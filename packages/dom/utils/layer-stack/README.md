# @dunky.dev/dom-layer-stack

Framework-free shared registry of open overlay layers (dialogs, popovers,
menus). Every open layer registers `{ id, path, element, modal }` — `path` is
its nesting chain of layer ids, outermost first, ending with its own — and
gets an unregister disposer back; `isTopmostLayer(id)` answers which layer
currently owns Escape, the focus trap, and outside presses — the deepest
layer (longest path) wins, open order breaks ties; `layerContainsTarget(id,
target)` reports whether a node falls inside the layer's subtree or a
descendant layer's, so outside-press detection can ignore nested layers.
Ancestry decides containment, not depth: an independent layer — a sibling, or
even a deeper layer of an unrelated stack — is still outside.

Registering also keeps assistive-tech containment in sync: everything outside
the topmost modal layer — and the layers stacked above it — gets `aria-hidden`
and `inert`, with an exact undo when the stack changes. With no modal layer
registered, nothing is hidden, so non-modal layers participate in routing and
nesting without hiding anything.

The registry is one shared instance on purpose: every primitive must agree on
which layer is topmost, so one Escape press closes exactly one layer even when
different primitives stack.

`@dunky.dev/react-use-layer-stack` is the React half — the shared layer-path
hook and context that feed `path`.

## Install

```sh
npm install @dunky.dev/dom-layer-stack
```

## Usage

```ts
import { isTopmostLayer, layerContainsTarget, registerLayer } from '@dunky.dev/dom-layer-stack'

// While the overlay is open (`path` comes from the substrate's shared
// layer-path context):
const unregister = registerLayer({ id, path, element: panel, modal: true })

// Escape / focus trap / outside press ownership:
isTopmostLayer(id)

// Outside-press detection: a press inside a descendant layer is never outside.
layerContainsTarget(id, event.target)

// On close:
unregister()
```
