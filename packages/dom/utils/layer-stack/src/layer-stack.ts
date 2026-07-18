import { hideOutside } from './hide-outside'

export interface LayerInit {
  /** The id `isTopmostLayer` / `layerContainsTarget` answer for. */
  id: string
  /** Logical nesting level — from the substrate's shared depth context. */
  depth: number
  /** The layer's DOM subtree (its content panel). */
  element: HTMLElement
  /** Whether the layer hides everything outside itself from assistive tech. */
  modal: boolean
}

interface Layer extends LayerInit {
  order: number
}

// The shared registry of open overlay layers. One module-level instance on
// purpose: every primitive must agree on which layer is topmost, so one
// Escape press closes exactly one layer even across primitives. The topmost
// is the deepest-nested layer, with open order breaking ties between siblings.
//
// Depth (not DOM order) decides it: React inserts a nested layer's portal
// into the body *before* its parent's, so document order is the inverse of
// nesting.
const layers: Layer[] = []
let nextOrder = 0
let undoHide: (() => void) | undefined

function isAbove(layer: Layer, other: Layer): boolean {
  return layer.depth > other.depth || (layer.depth === other.depth && layer.order > other.order)
}

function topmost(): Layer | undefined {
  let top: Layer | undefined
  for (const layer of layers) {
    if (top === undefined || isAbove(layer, top)) top = layer
  }
  return top
}

// Keep the assistive-tech view in sync: the topmost MODAL layer anchors the
// containment, and every layer stacked above it (e.g. a non-modal popover
// over a modal dialog) stays reachable too; everything else is hidden. With
// no modal layer, nothing is hidden. Re-runs whenever the stack changes so a
// new layer hides the ones beneath it, and closing it restores them.
function syncContainment(): void {
  undoHide?.()
  undoHide = undefined

  let anchor: Layer | undefined
  for (const layer of layers) {
    if (layer.modal && (anchor === undefined || isAbove(layer, anchor))) anchor = layer
  }
  if (anchor === undefined) return

  const visible: HTMLElement[] = []
  for (const layer of layers) {
    // `isConnected` guards teardown, when a content panel is already detached.
    if ((layer === anchor || isAbove(layer, anchor)) && layer.element.isConnected) {
      visible.push(layer.element)
    }
  }
  if (visible.length > 0) undoHide = hideOutside(visible)
}

export function registerLayer(layer: LayerInit): () => void {
  const entry: Layer = { ...layer, order: nextOrder++ }
  layers.push(entry)
  syncContainment()
  return () => {
    const index = layers.indexOf(entry)
    if (index !== -1) layers.splice(index, 1)
    syncContainment()
  }
}

export function isTopmostLayer(id: string): boolean {
  return topmost()?.id === id
}

/**
 * Whether `target` falls inside the layer's own subtree or a deeper layer's —
 * outside-press detection uses this so a press in a nested layer never counts
 * as outside the one beneath. Nesting depth decides, not stack position: an
 * independent sibling at the same depth is still outside, so pressing it
 * dismisses this layer.
 */
export function layerContainsTarget(id: string, target: Node): boolean {
  let base: Layer | undefined
  for (const layer of layers) {
    if (layer.id === id) {
      base = layer
      break
    }
  }
  if (base === undefined) return false
  for (const layer of layers) {
    if ((layer === base || layer.depth > base.depth) && layer.element.contains(target)) return true
  }
  return false
}
