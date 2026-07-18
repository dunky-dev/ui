import { hideOutside } from './hide-outside'

// The shared registry of open dialogs. The topmost — the one Escape and the
// focus trap act on, and the one whose content stays visible to assistive tech —
// is the deepest-nested dialog, with open order breaking ties between siblings.
//
// Depth (not DOM order) decides it: React inserts a nested dialog's portal into
// the body *before* its parent's, so document order is the inverse of nesting.
interface Layer {
  id: string
  depth: number
  order: number
  element: HTMLElement
  modal: boolean
}

const layers: Layer[] = []
let nextOrder = 0
let undoHide: (() => void) | undefined

function topmost(): Layer | undefined {
  let top: Layer | undefined
  for (const layer of layers) {
    if (
      top === undefined ||
      layer.depth > top.depth ||
      (layer.depth === top.depth && layer.order > top.order)
    ) {
      top = layer
    }
  }
  return top
}

// Keep the assistive-tech view in sync: only the topmost modal dialog stays
// reachable; everything else is hidden. Re-runs whenever the stack changes so a
// nested dialog hides the one beneath it, and closing it restores the layer.
function syncAriaHidden(): void {
  undoHide?.()
  undoHide = undefined
  const top = topmost()
  if (top?.modal !== true) return
  // `isConnected` guards teardown, when the content is already detached.
  if (top.element.isConnected) undoHide = hideOutside(top.element)
}

export function registerDialog(layer: Omit<Layer, 'order'>): () => void {
  const entry: Layer = { ...layer, order: nextOrder++ }
  layers.push(entry)
  syncAriaHidden()
  return () => {
    const index = layers.indexOf(entry)
    if (index !== -1) layers.splice(index, 1)
    syncAriaHidden()
  }
}

export function isTopmostDialog(id: string): boolean {
  return topmost()?.id === id
}
