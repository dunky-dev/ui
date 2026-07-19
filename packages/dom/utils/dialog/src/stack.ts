import { hideOutside } from './hide-outside'

// The shared registry of open dialogs. The topmost — the one Escape and the
// focus trap act on, and the one whose content stays visible to assistive tech —
// is the deepest-nested dialog, with open order breaking ties between siblings.
//
// Depth (not DOM order) decides it: a substrate may insert a nested dialog's
// portal into the body *before* its parent's (React does), so document order
// can be the inverse of nesting.
export interface DialogLayer {
  id: string
  depth: number
  order: number
  element: HTMLElement
  modal: boolean
  /**
   * Resolves the layer's own backdrop — rendered outside the content's subtree
   * yet part of the layer, so it must stay pressable while its dialog is
   * topmost. A getter (not a snapshot) so a re-hide — when a layer above
   * closes — sees the element current at that moment.
   */
  backdrop?: () => Element | null
}

const layers: DialogLayer[] = []
let nextOrder = 0
let undoHide: (() => void) | undefined

function topmost(): DialogLayer | undefined {
  let top: DialogLayer | undefined
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
  if (top.element.isConnected) undoHide = hideOutside(top.element, top.backdrop?.() ?? null)
}

export function registerDialog(layer: Omit<DialogLayer, 'order'>): () => void {
  const entry: DialogLayer = { ...layer, order: nextOrder++ }
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
